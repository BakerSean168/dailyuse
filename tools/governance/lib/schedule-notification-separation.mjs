/**
 * Schedule ↔ Notification separation audit (pure logic).
 *
 * Enforces NOTIF-3302 / HARD-7102: the Scheduler orchestration core must stay
 * notification-domain neutral. Task and Goal reminder handlers durably emit a
 * `NotificationRequested` envelope through their own business boundaries; the
 * scheduler only wakes handlers and returns an outcome. It must never:
 *
 *   1. import the Notification package (any subpath), so it can never reach a
 *      channel deliverer or construct a legacy ScheduleNotificationPort;
 *   2. reference the removed legacy delivery symbols
 *      (`ScheduleNotificationPort` / `scheduleNotificationPort` /
 *      `createNotificationPrismaScheduleNotificationPort`);
 *   3. drive execution dispatch with `switch (...sourceModule / SourceModule)`.
 *      The retained legacy fallback in `execution/router.ts` uses an
 *      if-cascade (domain-neutral), which is intentionally allowed.
 *
 * This audit is required because `schedule-orchestration` is tagged
 * `scope:shared`, so the ESLint `nx-enforce-module-boundaries` constraint does
 * not police its imports — a dedicated governance check is the only gate.
 */

import { findPatternMatches } from './source-scan.mjs';

/**
 * Any quoted `@memoflow/notification` module specifier, independent of the
 * import form. Matches the package string literal itself so a side-effect
 * import (`import '@memoflow/notification';`), a deep subpath
 * (`@memoflow/notification/server/infrastructure`), `require(...)`, dynamic
 * `import(...)` and multiline `from` imports are all caught even though the
 * keyword and the specifier sit on different lines.
 */
export const NOTIFICATION_IMPORT_PATTERN =
  /['"`](@memoflow\/notification(?:\/[a-zA-Z0-9_.\/-]*)?)['"`]/;

/** Removed legacy scheduler→notification delivery symbols (NOTIF-3302). */
export const LEGACY_NOTIFICATION_PORT_PATTERN =
  /\b(?:ScheduleNotificationPort|scheduleNotificationPort|createNotificationPrismaScheduleNotificationPort)\b/;

/**
 * `switch (...sourceModule)` execution dispatch. The old router switched
 * execution on `task.sourceModule`; the Scheduler must dispatch on handlerKey +
 * payloadVersion only.
 */
export const SOURCE_MODULE_EXECUTION_SWITCH_PATTERN =
  /switch\s*\(\s*([a-zA-Z0-9_$.\[\]]*\.)?sourceModule\s*\)/i;

/**
 * Directory roots (relative to the repo root) the audit scans for production
 * source. `collectSourceFiles` already skips `__tests__` / dist etc.
 */
export const SCHEDULER_SCAN_ROOTS = [
  'packages/schedule-orchestration/src',
  'packages/schedule/src/server/infrastructure/scheduling',
];

export function isSchedulerScanRoot(relPath, scanRoots = SCHEDULER_SCAN_ROOTS) {
  return scanRoots.some((root) => relPath.startsWith(root));
}

/**
 * Find schedule↔notification separation violations across the given files.
 * @param {Array<{ relPath: string, content: string }>} files
 * @param {{ scanRoots?: string[] }} [options]
 * @returns {{ violations: Array<{file:string,line:number,kind:string,text:string}>, auditedFiles:number }}
 */
export function findScheduleNotificationSeparationViolations(files, options = {}) {
  const scanRoots = options.scanRoots ?? SCHEDULER_SCAN_ROOTS;
  const violations = [];
  let auditedFiles = 0;

  for (const { relPath, content } of files) {
    if (!isSchedulerScanRoot(relPath, scanRoots)) continue;
    auditedFiles += 1;

    const importMatches = findPatternMatches(content, NOTIFICATION_IMPORT_PATTERN);
    const symbolMatches = findPatternMatches(content, LEGACY_NOTIFICATION_PORT_PATTERN);
    const switchMatches = findPatternMatches(content, SOURCE_MODULE_EXECUTION_SWITCH_PATTERN);

    for (const match of importMatches) {
      violations.push({
        file: relPath,
        line: match.line,
        kind: 'notification-import',
        text: match.text,
      });
    }
    for (const match of symbolMatches) {
      violations.push({
        file: relPath,
        line: match.line,
        kind: 'legacy-notification-port',
        text: match.text,
      });
    }
    for (const match of switchMatches) {
      violations.push({
        file: relPath,
        line: match.line,
        kind: 'source-module-switch',
        text: match.text,
      });
    }
  }

  return { violations, auditedFiles };
}

export function formatScheduleNotificationSeparationViolation({ file, line, kind, text }) {
  const message = {
    'notification-import':
      'Scheduler orchestration must not import the Notification package (NOTIF-3302) — Task/Goal handlers emit NotificationRequested through their own boundaries',
    'legacy-notification-port':
      'legacy scheduler→notification delivery symbol is forbidden (NOTIF-3302 removed the direct notification path)',
    'source-module-switch':
      'execution dispatch must not switch on sourceModule/SourceModule (HARD-7102) — dispatch on handlerKey + payloadVersion only',
  }[kind];
  return `${file}:${line}: ${message} [${text}]`;
}
