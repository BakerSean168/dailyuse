#!/usr/bin/env node

/**
 * Schedule ↔ Notification Separation Audit (CLI)
 *
 * Fails if the Scheduler orchestration core imports the Notification package,
 * references the removed legacy scheduler→notification delivery symbols, or
 * switches execution dispatch on sourceModule/SourceModule.
 * See NOTIF-3302 / HARD-7102 and tools/governance/lib/schedule-notification-separation.mjs.
 *
 * Exit codes:
 *   0 - scheduler orchestration core stays notification-domain neutral
 *   1 - separation violation detected
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { collectSourceFiles } from './lib/source-scan.mjs';
import {
  findScheduleNotificationSeparationViolations,
  formatScheduleNotificationSeparationViolation,
  SCHEDULER_SCAN_ROOTS,
} from './lib/schedule-notification-separation.mjs';

const ROOT = path.join(import.meta.dirname, '..', '..');

const files = SCHEDULER_SCAN_ROOTS.flatMap((scanRoot) =>
  collectSourceFiles(path.join(ROOT, scanRoot), ROOT),
).map(({ relPath, absPath }) => ({ relPath, content: readFileSync(absPath, 'utf-8') }));

const { violations, auditedFiles } = findScheduleNotificationSeparationViolations(files);

if (violations.length > 0) {
  console.error(
    `[schedule-notification-separation-audit] failed with ${violations.length} issue(s):`,
  );
  for (const violation of violations) {
    console.error(`  ${formatScheduleNotificationSeparationViolation(violation)}`);
  }
  process.exit(1);
}

console.log(
  `[schedule-notification-separation-audit] passed (${auditedFiles} files audited in: ${SCHEDULER_SCAN_ROOTS.join(', ')})`,
);
