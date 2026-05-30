#!/usr/bin/env node
/**
 * Package-Internal Boundary Audit
 *
 * Checks that feature packages遵守包内分层约束：
 *   - domain-server 不得导入 infrastructure-server / api / controllers / application-client / infrastructure-client
 *   - application-server 不得导入 infrastructure-server / api / controllers / application-client / infrastructure-client
 *   - controllers 不得导入 infrastructure-server / infrastructure-client / api
 *
 * 只检查 within-package 导入（@/ 别名和相对路径），不检查跨包导入（@dailyuse/xxx/...）。
 *
 * @see docs/standards/architecture.md
 * @see docs/architecture/adr/ADR-031-server-feature-standard-shape.md
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const PACKAGES_DIR = join(ROOT, 'packages');

// Layers that are audited and their forbidden import targets (within-package)
const LAYER_RULES = [
  {
    layer: 'domain-server',
    forbidden: ['infrastructure-server', 'infrastructure-client', 'application-client', 'api', 'controllers'],
  },
  {
    layer: 'application-server',
    forbidden: ['infrastructure-server', 'infrastructure-client', 'application-client', 'api', 'controllers'],
  },
  {
    layer: 'controllers',
    forbidden: ['infrastructure-server', 'infrastructure-client', 'api'],
  },
];

// Packages excluded from this audit (same as server-feature-shape-audit)
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

// Pre-existing violations that are tracked for future fixing.
// Each entry: "relative/path.ts: layer must not import from forbidden (found: 'specifier')"
const KNOWN_VIOLATIONS = new Set([
  // TODO: move mapper to application-server or use a port
  'packages/goal/src/application-server/mappers/goal.mapper.ts: application-server must not import from infrastructure-server (found: \'@/infrastructure-server/adapters/prisma/mappers/goal-state-mapper\')',
  // TODO: move path resolver to domain or application layer
  'packages/ai/src/application-server/use-cases/commands/manage-ai-knowledge-note.use-case.ts: application-server must not import from infrastructure-server (found: \'../../../infrastructure-server/services/ai-knowledge-note-path-resolver\')',
  // TODO: move fs-storage adapter dependency behind a port
  'packages/repository/src/application-server/index.ts: application-server must not import from infrastructure-server (found: \'../infrastructure-server/adapters/fs/fs-storage.adapter\')',
  // TODO: extract runtime types to domain-shared or contracts
  'packages/schedule/src/application-server/source-executors/shared-source-executor.ts: application-server must not import from api (found: \'../../api/runtime\')',
  'packages/schedule/src/application-server/source-executors/types.ts: application-server must not import from api (found: \'../../api/runtime\')',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

function main() {
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const violations = [];
  let auditedFiles = 0;

  for (const pkg of packages) {
    if (EXCEPTIONS.has(pkg)) continue;

    const srcDir = join(PACKAGES_DIR, pkg, 'src');
    if (!existsSync(srcDir)) continue;

    const srcContents = readdirSync(srcDir);
    const hasDomainServer = srcContents.some((d) => d.startsWith('domain'));
    if (!hasDomainServer) continue; // Not a feature package

    for (const rule of LAYER_RULES) {
      const layerDir = join(srcDir, rule.layer);
      if (!existsSync(layerDir)) continue;

      walkLayer(layerDir, pkg, rule, violations, () => auditedFiles++);
    }
  }

  // Deduplicate violations (same file + message can appear from import type + value)
  const uniqueViolations = [];
  const seen = new Set();
  for (const v of violations) {
    const key = `${v.file}: ${v.message}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (KNOWN_VIOLATIONS.has(key)) {
      console.warn(`  ⚠ known violation (tracked): ${key}`);
      continue;
    }
    uniqueViolations.push(v);
  }

  if (uniqueViolations.length > 0) {
    console.error(`❌ Package-Internal Boundary Audit FAILED — ${uniqueViolations.length} new violation(s):\n`);
    for (const v of uniqueViolations) {
      console.error(`  ${v.file}: ${v.message}`);
    }
    console.error(
      '\nSee docs/standards/architecture.md for package-internal layering rules.'
    );
    process.exit(1);
  }

  const knownCount = seen.size - uniqueViolations.length;
  console.log(
    `✅ Package-Internal Boundary Audit passed (${auditedFiles} files audited, ${knownCount} known violation(s) tracked)`
  );
}

/**
 * Walk all .ts files in a layer directory and check imports.
 */
function walkLayer(dir, pkg, rule, violations, countFile) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkLayer(fullPath, pkg, rule, violations, countFile);
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(ext)) continue;

    // Skip test files — they have separate boundary rules
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
    if (fullPath.includes('__tests__')) continue;

    countFile();
    const content = readFileSync(fullPath, 'utf8').replace(/^﻿/, '');
    const relPath = relative(ROOT, fullPath).replaceAll('\\', '/');

    checkImports(content, relPath, rule, violations);
  }
}

/**
 * Extract import specifiers from source content and check against forbidden targets.
 */
function checkImports(content, relPath, rule, violations) {
  // Match: import ... from '...'  and  import('...')
  const importPattern = /(?:from\s+['"]|import\s*\(\s*['"])([^'"]+)['"]/g;

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const specifier = match[1];

    // Only check within-package imports:
    //   - @/xxx/...  (path alias to src/)
    //   - ../xxx/... or ./xxx/... (relative)
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

/**
 * If the import specifier is a within-package reference, return the target layer name.
 * Returns null for cross-package or non-layer imports.
 */
function getWithinPackageLayer(specifier) {
  // @/alias imports — the part after @/ is the layer name
  if (specifier.startsWith('@/')) {
    const rest = specifier.slice(2);
    const layer = rest.split('/')[0];
    return layer;
  }

  // Relative imports — walk up to find the target layer
  // e.g. '../../infrastructure-server/foo' → 'infrastructure-server'
  if (specifier.startsWith('../') || specifier.startsWith('./')) {
    const parts = specifier.split('/');
    // Find the first part that matches a known layer name
    for (const part of parts) {
      if (part === '.' || part === '..') continue;
      if (isLayerName(part)) return part;
    }
  }

  return null;
}

const LAYER_NAMES = new Set([
  'domain-server',
  'domain-client',
  'domain-shared',
  'application-server',
  'application-client',
  'infrastructure-server',
  'infrastructure-client',
  'controllers',
  'api',
  'contracts',
  'mocks',
  'electron-entry',
]);

function isLayerName(name) {
  return LAYER_NAMES.has(name);
}

main();
