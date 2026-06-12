#!/usr/bin/env node
/**
 * Package Export Audit
 *
 * Ensures feature package public surfaces stay within documented whitelist.
 * Two layers of audit:
 *
 * 1. Root barrel (src/index.ts):
 *    - Forbids `export * from './application-server'`
 *    - Forbids `export * from './infrastructure-server'`
 *    - Forbids re-exporting concrete infra adapter classes (Prisma/PowerSync/Adapter/Repository)
 *
 * 2. Export map (package.json#exports):
 *    - Only allows subpaths in the per-package whitelist
 *    - Flags undeclared subpath exports that widen the public surface
 *
 * Allowed subpath whitelist strategy:
 *  - Default allowed: ., ./domain-shared, ./domain-server, ./domain-client,
 *    ./infrastructure-client, ./api, ./electron-entry
 *  - Package-specific additions (contracts, mocks, testing, schema, etc.)
 *  - ./application-server is NOT in the default whitelist — it has zero external
 *    consumers and should not be part of the stable public surface.
 *  - ./infrastructure-server is NOT in the default whitelist — concrete adapters
 *    should not be part of the stable public surface. Apps resolve via tsconfig
 *    path aliases for composition root wiring.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', '..');
const PACKAGES = path.join(ROOT, 'packages');

const infraForbiddenNameRegex = /(Prisma|PowerSync|Adapter|Repository)$/;

/** Default allowed subpaths for feature packages */
const DEFAULT_ALLOWED_SUBPATHS = [
  '.',
  './domain-shared',
  './domain-server',
  './domain-client',
  './application-client',
  './infrastructure-client',
  './api',
  './electron-entry',
];

/** Per-package additions to the default whitelist */
const PACKAGE_SPECIFIC_SUBPATHS = {
  governance: ['./contracts', './mocks'],
  goal: ['./analytics', './events'],
  task: ['./analytics', './testing', './schema'],
  ai: ['./ports', './schema'],
  repository: ['./schema'],
  authentication: ['./schema'],
  notification: ['./commands', './schema'],
  reminder: ['./schema'],
  schedule: ['./schema'],
  setting: ['./schema'],
  contracts: [
    './task', './goal', './reminder', './editor', './repository',
    './account', './authentication', './schedule', './setting',
    './notification', './ai', './dashboard', './response', './result',
    './data-portability', './shared', './primitives', './electron', './mocks',
  ],
  database: ['./prisma'],
  'domain-shared': ['./shared'],
  patterns: ['./scheduler', './repository', './cache', './events'],
  utils: [
    './domain', './errors', './frontend', './lifecycle',
    './logger', './result', './shared', './validation', './winston',
  ],
  'test-utils': [
    './helpers', './helpers/*', './mocks', './fixtures',
    './fixtures/*', './setup', './setup/*',
  ],
  assets: ['./images', './audio'],
  'ui-core': ['./styles/globals.css', './styles/theme.css'],
  'ui-vue-shadcn': [
    './components/ui/button', './components/ui/card', './components/ui/input',
    './components/ui/label', './components/ui/sonner', './components/ui/tabs',
    './components/ui/tooltip', './composables/useProgressBar', './globals.css',
  ],
  'app-vue': [
    './web-overlays', './di', './desktop', './plugins/i18n', './router',
    './modules/authentication', './modules/account', './modules/goal',
    './modules/task', './modules/schedule', './modules/reminder',
    './modules/notification', './modules/repository', './modules/setting',
    './modules/governance', './modules/dashboard/adapters', './modules/editor',
    './modules/ai',
  ],
};

/**
 * Check if a subpath matches a pattern (supports trailing /* glob).
 */
function subpathMatches(subpath, pattern) {
  if (pattern.endsWith('/*')) {
    return subpath === pattern.slice(0, -2) || subpath.startsWith(pattern.slice(0, -1));
  }
  return subpath === pattern;
}

/**
 * Check if a subpath is allowed for a given package.
 */
function isSubpathAllowed(pkgName, subpath) {
  const defaultOk = DEFAULT_ALLOWED_SUBPATHS.some((p) => subpathMatches(subpath, p));
  if (defaultOk) return true;
  const specific = PACKAGE_SPECIFIC_SUBPATHS[pkgName] || [];
  return specific.some((p) => subpathMatches(subpath, p));
}

/**
 * Audit src/index.ts root barrel.
 */
function auditRootBarrel(pkg, violations) {
  const indexPath = path.join(PACKAGES, pkg, 'src', 'index.ts');
  if (!existsSync(indexPath)) return;
  const content = readFileSync(indexPath, 'utf8');
  const rel = path.relative(ROOT, indexPath).replaceAll('\\', '/');

  // forbid root barrel leaks of server application/infrastructure surfaces
  if (/export\s*\*\s*from\s+['"]\.\/application-server['"]/m.test(content)) {
    violations.push(`${rel} root barrel must not use "export * from './application-server'"`);
  }

  if (/export\s*\*\s*from\s+['"]\.\/infrastructure-server['"]/m.test(content)) {
    violations.push(`${rel} root barrel must not use "export * from './infrastructure-server'"`);
  }

  // detect named exports that re-export infra concrete classes
  const namedExportPattern = /export\s*\{([^}]+)\}\s*from\s+['"]\.\/infrastructure-server['"]/gm;
  let m;
  while ((m = namedExportPattern.exec(content)) !== null) {
    const names = m[1].split(',').map((s) => s.trim());
    for (const n of names) {
      if (infraForbiddenNameRegex.test(n) && !/^create/i.test(n)) {
        violations.push(`${rel} re-exports infra concrete '${n}' from infrastructure-server (forbidden)`);
      }
    }
  }
}

/**
 * Audit package.json#exports against whitelist.
 */
function auditExportMap(pkg, violations) {
  const pkgJsonPath = path.join(PACKAGES, pkg, 'package.json');
  if (!existsSync(pkgJsonPath)) return;
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  if (!pkgJson.exports) return;

  const rel = path.relative(ROOT, pkgJsonPath).replaceAll('\\', '/');
  const exportedKeys = Object.keys(pkgJson.exports);

  for (const key of exportedKeys) {
    if (!isSubpathAllowed(pkg, key)) {
      violations.push(`${rel} exports "${key}" which is not in the allowed whitelist for this package`);
    }
  }
}

function main() {
  const pkgs = readdirSync(PACKAGES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const violations = [];

  for (const pkg of pkgs) {
    auditRootBarrel(pkg, violations);
    auditExportMap(pkg, violations);
  }

  if (violations.length > 0) {
    console.error('❌ Package Export Audit FAILED');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log('✅ Package Export Audit passed');
}

main();
