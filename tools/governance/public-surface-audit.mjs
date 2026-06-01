#!/usr/bin/env node
// Public Surface Audit
//
// Ensures that the "single public surface" contract is maintained.
//
// Rule 1: apps source must NOT import @dailyuse/pkg/(domain-server|application-server|infrastructure-server|controllers)
// Rule 2: packages source must NOT cross-package import these internal layers
//         (intra-package relative imports like ../infrastructure-server are allowed)
//
// Allowed public subpaths (function seams, not layer seams):
//   api, electron-entry, ports, commands, testing, analytics, events, schema
//
// Test files and __tests__ directories are excluded.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', '..');
const APPS_DIR = path.join(ROOT, 'apps');
const PACKAGES_DIR = path.join(ROOT, 'packages');

/** Internal layer subpaths that must not be imported externally */
const FORBIDDEN_SUBPATHS = ['domain-server', 'application-server', 'infrastructure-server', 'controllers'];

/** Pattern: @dailyuse/<pkg>/<forbidden-subpath> (single-line only) */
const IMPORT_REGEX = /from\s+['"]@dailyuse\/([^/'"]+)\/(domain-server|application-server|infrastructure-server|controllers)['"]/g;

/** Allowed public subpath patterns (not layer seams) */
const ALLOWED_PUBLIC_SUBPATHS = new Set([
  'api', 'electron-entry', 'ports', 'commands', 'testing',
  'analytics', 'events', 'schema', 'mocks', 'contracts',
]);

/**
 * Get all .ts/.tsx/.vue files recursively, excluding test files.
 */
function getSourceFiles(dir, extensions = ['.ts', '.tsx', '.vue']) {
  const results = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__tests__') continue;
      results.push(...getSourceFiles(fullPath, extensions));
    } else {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.test.tsx') && !entry.name.endsWith('.spec.tsx')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Determine which package a file belongs to.
 * Returns null if the file is not in a package.
 */
function getPackageForFile(filePath) {
  const rel = path.relative(PACKAGES_DIR, filePath);
  if (rel.startsWith('..')) return null;
  const parts = rel.split(path.sep);
  return parts[0] || null;
}

/**
 * Audit a single file for forbidden cross-boundary imports.
 */
function auditFile(filePath, violations) {
  const content = readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT, filePath).replaceAll('\\', '/');
  const isInApps = relPath.startsWith('apps/');
  const pkg = getPackageForFile(filePath);

  let match;
  IMPORT_REGEX.lastIndex = 0;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importedPkg = match[1];
    const subpath = match[2];

    if (isInApps) {
      // Apps must never import internal layers
      violations.push(`${relPath}: imports @dailyuse/${importedPkg}/${subpath} (apps must use public API surface)`);
    } else if (pkg && importedPkg !== pkg) {
      // Cross-package import of internal layer
      violations.push(`${relPath}: cross-package import @dailyuse/${importedPkg}/${subpath} from package "${pkg}" (use @dailyuse/${importedPkg}/api or other public seam)`);
    }
    // Intra-package imports (same package) are allowed
  }
}

function main() {
  const violations = [];

  // Audit apps
  for (const app of readdirSync(APPS_DIR, { withFileTypes: true })) {
    if (!app.isDirectory()) continue;
    const srcDir = path.join(APPS_DIR, app.name, 'src');
    if (!existsSync(srcDir)) continue;
    const files = getSourceFiles(srcDir);
    for (const file of files) {
      auditFile(file, violations);
    }
  }

  // Audit packages (cross-package only)
  for (const pkg of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    const srcDir = path.join(PACKAGES_DIR, pkg.name, 'src');
    if (!existsSync(srcDir)) continue;
    const files = getSourceFiles(srcDir);
    for (const file of files) {
      auditFile(file, violations);
    }
  }

  if (violations.length > 0) {
    console.error('❌ Public Surface Audit FAILED');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log('✅ Public Surface Audit passed');
}

main();
