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
  // Match both the legacy layout (domain-server / infrastructure-server) and the
  // server-feature-shape layout introduced by the client/electron/server refactor
  // (server/domain / server/infrastructure).
  const isServerAggregate =
    (relPath.includes('/domain-server/') || relPath.includes('/server/domain/')) &&
    relPath.includes('/aggregates/');
  const isServerRepo =
    (relPath.includes('/infrastructure-server/') || relPath.includes('/server/infrastructure/')) &&
    /repository\.[tj]s$/i.test(relPath);
  return isServerAggregate || isServerRepo;
});

const project = new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true });
for (const { absPath } of files) {
  project.addSourceFileAtPath(absPath);
}

/**
 * Baseline of pre-existing suspected misses (repo-root-relative).
 *
 * Previously this froze 7 legacy-layout repositories. Scanning the server-first
 * layout surfaced 2 additional Rule repositories, for 9 repositories in total.
 * They now use the unified event publishing seam (工程 C), so the baseline is
 * EMPTY: every event-emitting aggregate repository in the tree flushes its
 * events on save. The audit fails on any new miss.
 */
const BASELINE_ALLOWLIST = new Set([]);

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
