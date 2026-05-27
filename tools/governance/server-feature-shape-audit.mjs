#!/usr/bin/env node
/**
 * Server Feature Shape Audit
 *
 * Checks that business feature packages follow the standard shape
 * defined in ADR-031 (docs/architecture/adr/ADR-031-server-feature-standard-shape.md).
 *
 * Standard shape:
 *   domain-server/, domain-client/, domain-shared/, application-server/,
 *   application-client/, controllers/, api/, infrastructure-server/, infrastructure-client/
 *
 * Exceptions:
 *   - powersync-schema: schema-only, not a full feature
 *   - dashboard: read-model, no write side
 *   - domain-shared: shared kernel, not a feature
 *   - contracts: protocol definitions, not a feature
 *   - patterns, utils, test-utils, assets: support packages
 */

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '..', '..', 'packages');

const REQUIRED_DIRS = [
  'domain-server',
  'domain-client',
  'domain-shared',
  'application-server',
  'application-client',
  'controllers',
  'api',
];

const EXCEPTIONS = new Set([
  'powersync-schema',   // schema-only
  'dashboard',          // read-model
  'domain-shared',      // shared kernel
  'contracts',          // protocol definitions
  'patterns',           // support package
  'utils',              // support package
  'test-utils',         // support package
  'assets',             // support package
  'ui-vue-shadcn',      // UI library
  'ui-react-native',    // UI library
  'app-vue',            // app shell
  'app-react',          // app shell
  'database',           // database client
  'ipc-client',         // transport
  'http-client',        // transport
]);

// Packages that are known to be missing required directories (pre-existing)
const KNOWN_GAPS = {
  authentication: ['domain-client'], // TODO: extract client-side domain types
};

function main() {
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const violations = [];

  for (const pkg of packages) {
    if (EXCEPTIONS.has(pkg)) continue;

    const srcDir = join(PACKAGES_DIR, pkg, 'src');
    if (!existsSync(srcDir)) continue;

    const srcContents = readdirSync(srcDir);
    const hasDomainServer = srcContents.some((d) => d.startsWith('domain'));
    if (!hasDomainServer) continue; // Not a feature package

    const knownGap = KNOWN_GAPS[pkg] ?? [];
    const missing = REQUIRED_DIRS.filter((dir) => !srcContents.includes(dir) && !knownGap.includes(dir));
    if (missing.length > 0) {
      violations.push({ package: pkg, missing });
    }
  }

  if (violations.length > 0) {
    console.error('❌ Server Feature Shape Audit FAILED\n');
    console.error('The following packages are missing required directories per ADR-031:\n');
    for (const v of violations) {
      console.error(`  ${v.package}: missing ${v.missing.join(', ')}`);
    }
    console.error('\nSee docs/architecture/adr/ADR-031-server-feature-standard-shape.md');
    process.exit(1);
  }

  console.log('✅ Server Feature Shape Audit passed');
}

main();
