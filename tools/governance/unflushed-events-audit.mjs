#!/usr/bin/env node

/**
 * Unflushed Domain-Events Audit (CLI)
 *
 * Loads all domain-server aggregate + repository sources into a ts-morph Project
 * and flags repositories that persist an event-emitting aggregate without ever
 * calling flushDomainEvents/publishDomainEvents. See lib/unflushed-events.mjs.
 *
 * Exit codes:
 *   0 - no suspected unflushed-event repositories
 *   1 - suspected miss detected
 */

import path from 'node:path';
import { Project } from 'ts-morph';
import { collectSourceFiles } from './lib/source-scan.mjs';
import { auditUnflushedEvents, formatUnflushedViolation } from './lib/unflushed-events.mjs';

const ROOT = path.join(import.meta.dirname, '..', '..');
const PACKAGES = path.join(ROOT, 'packages');

// Only aggregate + repository sources are needed to decide both halves of the rule.
const files = collectSourceFiles(PACKAGES, ROOT).filter(({ relPath }) => {
  if (/\.(spec|test)\.[tj]sx?$/.test(relPath)) return false;
  // In-memory repositories are unit-test doubles; they intentionally do not
  // publish domain events and are out of scope.
  if (relPath.includes('/adapters/memory/')) return false;
  const isServerAggregate = relPath.includes('/domain-server/') && relPath.includes('/aggregates/');
  const isServerRepo =
    relPath.includes('/infrastructure-server/') && /repository\.[tj]s$/i.test(relPath);
  return isServerAggregate || isServerRepo;
});

const project = new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true });
for (const { absPath } of files) {
  project.addSourceFileAtPath(absPath);
}

/**
 * Baseline of pre-existing suspected misses (repo-root-relative).
 *
 * These production repositories persist an event-emitting aggregate without a
 * flush in-file. They are SURFACED, not blessed: this audit is introduced with
 * the current tree frozen as a baseline so it fails on any NEW miss. Triaging
 * whether each of these is a genuine event-loss bug or an intentionally
 * unpublished aggregate is tracked as follow-up, out of this PR's scope.
 */
const BASELINE_ALLOWLIST = new Set([
  'packages/account/src/infrastructure-server/adapters/powersync/account-powersync.repository.ts',
  'packages/authentication/src/infrastructure-server/adapters/powersync/auth-session-powersync.repository.ts',
  'packages/notification/src/infrastructure-server/adapters/powersync/notification-template-powersync.repository.ts',
  'packages/notification/src/infrastructure-server/adapters/prisma/notification-template-prisma.repository.ts',
  'packages/reminder/src/infrastructure-server/adapters/powersync/reminder-group-powersync.repository.ts',
  'packages/repository/src/infrastructure-server/adapters/powersync/repository-powersync.repository.ts',
  'packages/repository/src/infrastructure-server/adapters/prisma/repository-prisma.repository.ts',
]);

const toRel = (absPath) => path.relative(ROOT, absPath).split(path.sep).join('/');

const { emitting, violations, allowlistedHits } = auditUnflushedEvents(project, {
  isAllowlisted: (absPath) => BASELINE_ALLOWLIST.has(toRel(absPath)),
});

if (violations.length > 0) {
  console.error(`[unflushed-events-audit] failed with ${violations.length} issue(s):`);
  for (const violation of violations) {
    console.error(`  ${formatUnflushedViolation(violation, ROOT)}`);
  }
  process.exit(1);
}

console.log(
  `[unflushed-events-audit] passed (${files.length} files audited, ${emitting.size} event-emitting aggregate(s), ${allowlistedHits} baseline exemption(s))`,
);
