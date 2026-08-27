/**
 * Legacy Reminder due-set shadow cron — read-only cutover diagnostic.
 * 旧 Reminder due-set shadow cron —— 只读切换诊断器。
 *
 * ROUTINE-3402 removes the legacy Reminder cron as a wall-clock authority.
 * This compatibility factory intentionally retains the old exported name so
 * stale callers fail safe: execute() may only read the legacy due set, compare
 * it with the Scheduler due set, and emit diagnostics. It MUST NOT write
 * ReminderHistory, advance nextTriggerAt, claim occurrences, or enqueue a
 * notification.
 */

import * as cron from 'node-cron';
import type { IReminderTemplateRepository } from '../../domain/repositories/i-reminder-template-repository';
import { createLogger } from '@memoflow/utils/logger';
import type { ReminderModuleRuntimeContribution } from '../reminder.module';

const logger = createLogger('ReminderDueSetShadowCron');

export interface ReminderDueSetEntry {
  readonly identityId: string;
  readonly reminderId: string;
  readonly dueAt: number;
}

export interface ReminderDueSetReader {
  readDueSet(beforeTime: number, limit?: number): Promise<readonly ReminderDueSetEntry[]>;
}

export interface ReminderDueSetTimingMismatch {
  readonly identityId: string;
  readonly reminderId: string;
  readonly legacyDueAt: number;
  readonly schedulerDueAt: number;
}

export interface ReminderDueSetComparison {
  readonly checkedAt: number;
  readonly matched: boolean;
  readonly legacyCount: number;
  readonly schedulerCount: number;
  readonly legacyOnly: readonly ReminderDueSetEntry[];
  readonly schedulerOnly: readonly ReminderDueSetEntry[];
  readonly timingMismatches: readonly ReminderDueSetTimingMismatch[];
  readonly duplicateLegacyKeys: readonly string[];
  readonly duplicateSchedulerKeys: readonly string[];
}

export interface ReminderTriggerCronJobDependencies {
  /** Legacy source of truth used only for a read-only due-set snapshot. */
  readonly reminderTemplateRepository: Pick<IReminderTemplateRepository, 'findByNextTriggerBefore'>;
  /** Scheduler-side read model. The shadow job never executes these tasks. */
  readonly schedulerDueSetReader: ReminderDueSetReader;
  readonly maxCount?: number;
  readonly drainTimeoutMs?: number;
  readonly now?: () => number;
  readonly onComparison?: (comparison: ReminderDueSetComparison) => void | Promise<void>;
}

function entryKey(entry: ReminderDueSetEntry): string {
  return `${entry.identityId}\u0000${entry.reminderId}`;
}

function compareDueEntries(a: ReminderDueSetEntry, b: ReminderDueSetEntry): number {
  return a.dueAt - b.dueAt || entryKey(a).localeCompare(entryKey(b));
}

function groupEntries(
  entries: readonly ReminderDueSetEntry[],
): Map<string, readonly ReminderDueSetEntry[]> {
  const grouped = new Map<string, ReminderDueSetEntry[]>();
  for (const entry of entries) {
    const key = entryKey(entry);
    const current = grouped.get(key) ?? [];
    current.push(entry);
    grouped.set(key, current);
  }
  return grouped;
}

/** Compare legacy and Scheduler due sets without mutating either side. */
export function compareReminderDueSets(params: {
  checkedAt: number;
  legacy: readonly ReminderDueSetEntry[];
  scheduler: readonly ReminderDueSetEntry[];
}): ReminderDueSetComparison {
  const legacyByKey = groupEntries(params.legacy);
  const schedulerByKey = groupEntries(params.scheduler);
  const legacyOnly: ReminderDueSetEntry[] = [];
  const schedulerOnly: ReminderDueSetEntry[] = [];
  const timingMismatches: ReminderDueSetTimingMismatch[] = [];
  const duplicateLegacyKeys: string[] = [];
  const duplicateSchedulerKeys: string[] = [];
  const keys = new Set([...legacyByKey.keys(), ...schedulerByKey.keys()]);

  for (const key of keys) {
    const legacyEntries = legacyByKey.get(key) ?? [];
    const schedulerEntries = schedulerByKey.get(key) ?? [];

    if (legacyEntries.length > 1) duplicateLegacyKeys.push(key);
    if (schedulerEntries.length > 1) duplicateSchedulerKeys.push(key);

    if (legacyEntries.length === 0) {
      schedulerOnly.push(...schedulerEntries);
      continue;
    }
    if (schedulerEntries.length === 0) {
      legacyOnly.push(...legacyEntries);
      continue;
    }

    const legacy = legacyEntries[0]!;
    const scheduler = schedulerEntries[0]!;
    if (legacy.dueAt !== scheduler.dueAt) {
      timingMismatches.push({
        identityId: legacy.identityId,
        reminderId: legacy.reminderId,
        legacyDueAt: legacy.dueAt,
        schedulerDueAt: scheduler.dueAt,
      });
    }

    // A duplicate is a mismatch even when its first timestamp happens to match.
    if (legacyEntries.length > 1) legacyOnly.push(...legacyEntries.slice(1));
    if (schedulerEntries.length > 1) schedulerOnly.push(...schedulerEntries.slice(1));
  }

  const matched =
    legacyOnly.length === 0 &&
    schedulerOnly.length === 0 &&
    timingMismatches.length === 0 &&
    duplicateLegacyKeys.length === 0 &&
    duplicateSchedulerKeys.length === 0;

  return {
    checkedAt: params.checkedAt,
    matched,
    legacyCount: params.legacy.length,
    schedulerCount: params.scheduler.length,
    legacyOnly,
    schedulerOnly,
    timingMismatches,
    duplicateLegacyKeys,
    duplicateSchedulerKeys,
  };
}

/**
 * Compatibility factory for the retired trigger cron.
 *
 * The name is retained until the cleanup wave, but the behavior is deliberately
 * read-only. Production composition no longer starts this contribution.
 */
export function createReminderTriggerCronJob(
  deps: ReminderTriggerCronJobDependencies,
): ReminderModuleRuntimeContribution {
  const maxCount = Math.max(1, deps.maxCount ?? 100);
  const now = deps.now ?? Date.now;
  let cronTask: cron.ScheduledTask | null = null;
  let isRunning = false;
  let isStopping = false;
  let currentExecutionPromise: Promise<void> | null = null;

  async function executeInternal(): Promise<void> {
    if (isRunning || isStopping) {
      logger.debug('Previous shadow scan still running or stopping; skipping');
      return;
    }

    isRunning = true;
    const startedAt = Date.now();
    const checkedAt = now();

    try {
      const legacyTemplates =
        await deps.reminderTemplateRepository.findByNextTriggerBefore(checkedAt);
      const legacy: ReminderDueSetEntry[] = legacyTemplates
        .flatMap((template) => {
          if (template.nextTriggerAt == null) return [];
          return [
            {
              identityId: String(template.identityId),
              reminderId: String(template.id),
              dueAt: template.nextTriggerAt,
            },
          ];
        })
        .sort(compareDueEntries)
        .slice(0, maxCount);
      const scheduler = await deps.schedulerDueSetReader.readDueSet(checkedAt, maxCount);
      const comparison = compareReminderDueSets({ checkedAt, legacy, scheduler });

      if (comparison.matched) {
        logger.debug('Reminder due-set shadow matched Scheduler', {
          checkedAt,
          count: comparison.legacyCount,
          durationMs: Date.now() - startedAt,
        });
      } else {
        logger.warn('Reminder due-set shadow mismatch', {
          ...comparison,
          durationMs: Date.now() - startedAt,
        });
      }

      await deps.onComparison?.(comparison);
    } catch (error) {
      logger.error('Reminder due-set shadow scan failed', {
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      });
    } finally {
      isRunning = false;
    }
  }

  function runScan(): Promise<void> {
    if (isRunning || isStopping) {
      return currentExecutionPromise ?? Promise.resolve();
    }
    const promise = executeInternal().finally(() => {
      if (currentExecutionPromise === promise) currentExecutionPromise = null;
    });
    currentExecutionPromise = promise;
    return promise;
  }

  return {
    start(): void {
      if (cronTask) return;
      isStopping = false;
      cronTask = cron.schedule('* * * * *', () => {
        void runScan();
      });
      cronTask.start();
      logger.info('Reminder due-set shadow cron started (read-only)');
    },

    async stop(timeoutMs?: number): Promise<void> {
      const effectiveTimeout = timeoutMs ?? deps.drainTimeoutMs ?? 10_000;
      isStopping = true;
      cronTask?.stop();
      cronTask = null;

      if (currentExecutionPromise) {
        let timeoutHandle: NodeJS.Timeout | undefined;
        try {
          await Promise.race([
            currentExecutionPromise,
            new Promise<never>((_, reject) => {
              timeoutHandle = setTimeout(
                () => reject(new Error(`Shadow cron drain timed out after ${effectiveTimeout}ms`)),
                effectiveTimeout,
              );
            }),
          ]);
        } finally {
          if (timeoutHandle) clearTimeout(timeoutHandle);
        }
      }
    },

    execute(): Promise<void> {
      return runScan();
    },
  };
}
