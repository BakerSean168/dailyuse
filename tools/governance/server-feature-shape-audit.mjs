#!/usr/bin/env node
/**
 * Server Feature Shape Audit
 *
 * Checks that business feature packages follow the expected shape.
 * Governance is the reference module and uses `src/server/*` instead of the
 * older `*-server` directory pattern.
 */

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '..', '..', 'packages');

const DEFAULT_REQUIRED_DIRS = [
  'domain-server',
  'domain-client',
  'domain-shared',
  'application-server',
  'application-client',
  'controllers',
  'api',
];

const GOVERNANCE_REQUIRED_DIRS = ['server', 'api', 'client', 'electron'];
const GOVERNANCE_SERVER_REQUIRED_DIRS = ['domain', 'application', 'transport', 'infrastructure'];

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

const KNOWN_GAPS = {
  authentication: ['domain-client'],
};

function main() {
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const violations = [];

  for (const pkg of packages) {
    if (EXCEPTIONS.has(pkg)) continue;

    const srcDir = join(PACKAGES_DIR, pkg, 'src');
    if (!existsSync(srcDir)) continue;

    const srcContents = readdirSync(srcDir);

    if (pkg === 'governance') {
      const missingRootDirs = GOVERNANCE_REQUIRED_DIRS.filter((dir) => !srcContents.includes(dir));
      if (missingRootDirs.length > 0) {
        violations.push({ package: pkg, missing: missingRootDirs });
        continue;
      }

      const serverDir = join(srcDir, 'server');
      const serverContents = readdirSync(serverDir);
      const missingServerDirs = GOVERNANCE_SERVER_REQUIRED_DIRS
        .filter((dir) => !serverContents.includes(dir))
        .map((dir) => `server/${dir}`);

      if (missingServerDirs.length > 0) {
        violations.push({ package: pkg, missing: missingServerDirs });
      }
      continue;
    }

    if (!srcContents.includes('domain-server')) continue;

    const knownGap = KNOWN_GAPS[pkg] ?? [];
    const missing = DEFAULT_REQUIRED_DIRS.filter((dir) => !srcContents.includes(dir) && !knownGap.includes(dir));

    if (missing.length > 0) {
      violations.push({ package: pkg, missing });
    }
  }

  if (violations.length > 0) {
    console.error('❌ Server Feature Shape Audit FAILED\n');
    console.error('The following packages are missing required directories:\n');
    for (const violation of violations) {
      console.error(`  ${violation.package}: missing ${violation.missing.join(', ')}`);
    }
    process.exit(1);
  }

  console.log('✅ Server Feature Shape Audit passed');
}

main();