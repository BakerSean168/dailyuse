#!/usr/bin/env node
/**
 * Server Feature Shape Audit
 *
 * Checks that business feature packages follow the expected shape.
 * The canonical shape is now `src/server/*`.
 * Legacy server roots are forbidden for audited packages.
 */

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '..', '..', 'packages');

const FORBIDDEN_LEGACY_ROOT_DIRS = [
  'domain-server',
  'domain-shared',
  'application-server',
  'infrastructure-server',
  'controllers',
  'electron-entry',
];

const SERVER_FIRST_REQUIRED_DIRS = ['server', 'api', 'client', 'electron'];
const SERVER_SUBDIRS = ['domain', 'application', 'transport', 'infrastructure'];
const SERVER_REQUIRED_FILES = ['server/index.ts'];

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
  // Cross-feature orchestration package; see ADR-031 orchestration-package exception.
  'schedule-orchestration',
]);

const AUDITED_PACKAGES = new Set([
  'account',
  'ai',
  'authentication',
  'data-portability',
  'editor',
  'goal',
  'governance',
  'notification',
  'reminder',
  'repository',
  'schedule',
  'setting',
  'task',
]);

function main() {
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const violations = [];

  for (const pkg of packages) {
    if (EXCEPTIONS.has(pkg)) continue;
    if (!AUDITED_PACKAGES.has(pkg)) continue;

    const srcDir = join(PACKAGES_DIR, pkg, 'src');
    if (!existsSync(srcDir)) continue;

    const srcContents = readdirSync(srcDir);

    const missingRootDirs = SERVER_FIRST_REQUIRED_DIRS.filter((dir) => !srcContents.includes(dir));
    if (missingRootDirs.length > 0) {
      violations.push({ package: pkg, missing: missingRootDirs });
      continue;
    }

    const forbiddenRootDirs = FORBIDDEN_LEGACY_ROOT_DIRS.filter((dir) => srcContents.includes(dir));
    if (forbiddenRootDirs.length > 0) {
      violations.push({ package: pkg, forbidden: forbiddenRootDirs });
      continue;
    }

    const serverDir = join(srcDir, 'server');
    const serverContents = readdirSync(serverDir);
    const missingServerDirs = SERVER_SUBDIRS
      .filter((dir) => !serverContents.includes(dir))
      .map((dir) => `server/${dir}`);
    const missingServerFiles = SERVER_REQUIRED_FILES.filter((file) => !existsSync(join(srcDir, file)));

    const missingServerEntries = [...missingServerDirs, ...missingServerFiles];
    if (missingServerEntries.length > 0) {
      violations.push({ package: pkg, missing: missingServerEntries });
    }
  }

  if (violations.length > 0) {
    console.error('❌ Server Feature Shape Audit FAILED\n');
    console.error('The following packages violate the required server-first shape:\n');
    for (const violation of violations) {
      if (violation.missing?.length > 0) {
        console.error(`  ${violation.package}: missing ${violation.missing.join(', ')}`);
      }
      if (violation.forbidden?.length > 0) {
        console.error(`  ${violation.package}: forbidden legacy root ${violation.forbidden.join(', ')}`);
      }
    }
    process.exit(1);
  }

  console.log('✅ Server Feature Shape Audit passed');
}

main();
