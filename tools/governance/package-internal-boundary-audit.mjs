#!/usr/bin/env node
/**
 * Package-Internal Boundary Audit
 *
 * Checks that feature packages obey in-package layering constraints.
 * The canonical layout is `src/server/*`.
 * Legacy server roots are forbidden by `server-feature-shape-audit.mjs`.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findBoundaryViolations, shouldSkipSourceFile } from './lib/package-internal-boundary.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const PACKAGES_DIR = join(ROOT, 'packages');

const FORBIDDEN_LEGACY_LAYERS = [
  'domain-server',
  'domain-shared',
  'application-server',
  'infrastructure-server',
  'controllers',
  'electron-entry',
];

const FORBIDDEN_DB_SPECIFIERS = ['@memoflow/database', '@prisma/client'];

const GOVERNANCE_LAYER_RULES = [
  {
    layer: 'server/domain',
    forbidden: [
      'server/application',
      'server/transport',
      'server/infrastructure',
      'client',
      'electron',
      'api',
      ...FORBIDDEN_LEGACY_LAYERS,
    ],
    forbiddenExternalSpecifiers: FORBIDDEN_DB_SPECIFIERS,
  },
  {
    layer: 'server/application',
    forbidden: [
      'server/transport',
      'server/infrastructure',
      'client',
      'electron',
      'api',
      ...FORBIDDEN_LEGACY_LAYERS,
    ],
    forbiddenExternalSpecifiers: FORBIDDEN_DB_SPECIFIERS,
  },
  {
    layer: 'server/transport',
    forbidden: ['server/infrastructure', 'client', 'electron', 'api', ...FORBIDDEN_LEGACY_LAYERS],
  },
  {
    layer: 'client',
    forbidden: [
      'server/domain',
      'server/application',
      'server/transport',
      'server/infrastructure',
      'api',
      'electron',
      ...FORBIDDEN_LEGACY_LAYERS,
    ],
  },
];

const EXCEPTIONS = new Set([
  'powersync-schema',
  'dashboard',
  'domain-shared',
  'contracts',
  'patterns',
  'utils',
  'test-utils',
  'assets',
  'ui-vue-shadcn',
  'ui-react-native',
  'app-vue',
  'app-react',
  'database',
  'ipc-client',
  'http-client',
]);

const KNOWN_VIOLATIONS = new Set();

function main() {
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const violations = [];
  let auditedFiles = 0;

  for (const pkg of packages) {
    if (EXCEPTIONS.has(pkg)) continue;

    const srcDir = join(PACKAGES_DIR, pkg, 'src');
    if (!existsSync(srcDir)) continue;

    if (existsSync(join(srcDir, 'server'))) {
      for (const rule of GOVERNANCE_LAYER_RULES) {
        const layerDir = join(srcDir, ...rule.layer.split('/'));
        if (!existsSync(layerDir)) continue;
        walkLayer(layerDir, rule, violations, () => auditedFiles += 1);
      }
    }
  }

  const uniqueViolations = [];
  const seen = new Set();
  for (const violation of violations) {
    const key = `${violation.file}:${violation.line}: ${violation.message}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (KNOWN_VIOLATIONS.has(key)) {
      console.warn(`  ⚠ known violation (tracked): ${key}`);
      continue;
    }
    uniqueViolations.push(violation);
  }

  if (uniqueViolations.length > 0) {
    console.error(`❌ Package-Internal Boundary Audit FAILED — ${uniqueViolations.length} new violation(s):\n`);
    for (const violation of uniqueViolations) {
      console.error(`  ${violation.file}:${violation.line}: ${violation.message}`);
    }
    console.error('\nSee docs/standards/architecture.md for package-internal layering rules.');
    process.exit(1);
  }

  const knownCount = seen.size - uniqueViolations.length;
  console.log(
    `✅ Package-Internal Boundary Audit passed (${auditedFiles} files audited, ${knownCount} known violation(s) tracked)`,
  );
}

function walkLayer(dir, rule, violations, countFile) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkLayer(fullPath, rule, violations, countFile);
      continue;
    }
    if (!entry.isFile()) continue;

    if (shouldSkipSourceFile(entry.name, fullPath)) continue;

    countFile();
    const content = readFileSync(fullPath, 'utf8').replace(/^﻿/, '');
    const relPath = relative(ROOT, fullPath).replaceAll('\\', '/');
    violations.push(
      ...findBoundaryViolations({
        content,
        relPath,
        layer: rule.layer,
        forbidden: rule.forbidden,
        forbiddenExternalSpecifiers: rule.forbiddenExternalSpecifiers,
      }),
    );
  }
}

main();
