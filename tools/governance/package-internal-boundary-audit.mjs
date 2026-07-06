#!/usr/bin/env node
/**
 * Package-Internal Boundary Audit
 *
 * Checks that feature packages obey in-package layering constraints.
 * Governance uses the stricter `src/server/*` reference layout; older packages
 * still using `*-server` directories are audited with the legacy rules.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const PACKAGES_DIR = join(ROOT, 'packages');

const LEGACY_LAYER_RULES = [
  {
    layer: 'domain-server',
    forbidden: [
      'infrastructure-server',
      'infrastructure-client',
      'application-client',
      'client',
      'electron',
      'api',
      'controllers',
    ],
  },
  {
    layer: 'application-server',
    forbidden: [
      'infrastructure-server',
      'infrastructure-client',
      'application-client',
      'client',
      'electron',
      'api',
      'controllers',
    ],
  },
  {
    layer: 'controllers',
    forbidden: ['infrastructure-server', 'infrastructure-client', 'client', 'electron', 'api'],
  },
  {
    layer: 'client',
    forbidden: ['domain-server', 'application-server', 'infrastructure-server', 'controllers', 'api', 'electron'],
  },
];

const GOVERNANCE_LAYER_RULES = [
  {
    layer: 'server/domain',
    forbidden: ['server/application', 'server/transport', 'server/infrastructure', 'client', 'electron', 'api'],
  },
  {
    layer: 'server/application',
    forbidden: ['server/transport', 'server/infrastructure', 'client', 'electron', 'api'],
  },
  {
    layer: 'server/transport',
    forbidden: ['server/infrastructure', 'client', 'electron', 'api'],
  },
  {
    layer: 'client',
    forbidden: ['server/domain', 'server/application', 'server/transport', 'server/infrastructure', 'api', 'electron'],
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
const SOURCE_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);
const SERVER_SUBLAYERS = new Set(['domain', 'application', 'transport', 'infrastructure']);
const LEGACY_LAYER_NAMES = new Set([
  'domain-server',
  'domain-client',
  'domain-shared',
  'application-server',
  'application-client',
  'client',
  'electron',
  'infrastructure-server',
  'infrastructure-client',
  'controllers',
  'api',
  'contracts',
  'mocks',
  'electron-entry',
]);

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

    if (pkg === 'governance' && existsSync(join(srcDir, 'server'))) {
      for (const rule of GOVERNANCE_LAYER_RULES) {
        const layerDir = join(srcDir, ...rule.layer.split('/'));
        if (!existsSync(layerDir)) continue;
        walkLayer(layerDir, rule, violations, () => auditedFiles += 1);
      }
      continue;
    }

    const srcContents = readdirSync(srcDir);
    if (!srcContents.includes('domain-server')) continue;

    for (const rule of LEGACY_LAYER_RULES) {
      const layerDir = join(srcDir, rule.layer);
      if (!existsSync(layerDir)) continue;
      walkLayer(layerDir, rule, violations, () => auditedFiles += 1);
    }
  }

  const uniqueViolations = [];
  const seen = new Set();
  for (const violation of violations) {
    const key = `${violation.file}: ${violation.message}`;
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
      console.error(`  ${violation.file}: ${violation.message}`);
    }
    console.error('\nSee docs/standards/architecture.md for package-internal layering rules.');
    process.exit(1);
  }

  const knownCount = seen.size - uniqueViolations.length;
  console.log(`✅ Package-Internal Boundary Audit passed (${auditedFiles} files audited, ${knownCount} known violation(s) tracked)`);
}

function walkLayer(dir, rule, violations, countFile) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkLayer(fullPath, rule, violations, countFile);
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
    if (fullPath.includes('__tests__')) continue;

    countFile();
    const content = readFileSync(fullPath, 'utf8').replace(/^﻿/, '');
    const relPath = relative(ROOT, fullPath).replaceAll('\\', '/');
    checkImports(content, relPath, rule, violations);
  }
}

function checkImports(content, relPath, rule, violations) {
  const importPattern = /(?:from\s+['"]|import\s*\(\s*['"])([^'"]+)['"]/g;

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const specifier = match[1];
    const withinPackageTarget = getWithinPackageLayer(specifier);
    if (!withinPackageTarget) continue;

    if (rule.forbidden.includes(withinPackageTarget)) {
      violations.push({
        file: relPath,
        message: `${rule.layer} must not import from ${withinPackageTarget} (found: '${specifier}')`,
      });
    }
  }
}

function getWithinPackageLayer(specifier) {
  if (specifier.startsWith('@/')) {
    return getLayerFromParts(specifier.slice(2).split('/'));
  }

  if (specifier.startsWith('../') || specifier.startsWith('./')) {
    const parts = specifier.split('/').filter((part) => part !== '.' && part !== '..');
    return getLayerFromParts(parts);
  }

  return null;
}

function getLayerFromParts(parts) {
  if (parts.length === 0) return null;

  if (parts[0] === 'server' && SERVER_SUBLAYERS.has(parts[1])) {
    return `server/${parts[1]}`;
  }

  if (SERVER_SUBLAYERS.has(parts[0])) {
    return `server/${parts[0]}`;
  }

  if (LEGACY_LAYER_NAMES.has(parts[0])) {
    return parts[0];
  }

  return null;
}

main();