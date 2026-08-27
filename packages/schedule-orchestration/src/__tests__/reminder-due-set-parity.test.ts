import { describe, expect, it, vi } from 'vitest';
import {
  createReminderTriggerCronRuntime,
  type ReminderDueSetComparison,
} from '@memoflow/reminder';
import { SourceModule } from '@memoflow/contracts/schedule';
import type { ScheduleTask } from '@memoflow/schedule';
import { createReminderSchedulerDueSetReader } from '../shadow/reminder-due-set-shadow';

/**
 * ROUTINE-3402 due-set parity matrix.
 *
 * The legacy Reminder cron is now a read-only shadow. These tests drive the
 * REAL production shadow path (createReminderTriggerCronRuntime +
 * createReminderSchedulerDueSetReader) against a shared in-memory world that
 * keeps the legacy ReminderTemplate row and its projected ScheduleTask in the
 * same lockstep the production atomic commit enforces. Each scenario asserts
 * that the Scheduler due set and the former-cron due set are equivalent, and a
 * trailing drift test proves the comparison is not vacuous.
 */

const IDENTITY = 'identity-1';
const T0 = Date.parse('2026-08-27T08:00:00.000Z');
const MINUTE_MS = 60_000;

interface TemplateRow {
  id: string;
  identityId: string;
  nextTriggerAt: number | null;
  selfEnabled: boolean;
  status: string;
  deletedAt: boolean | null;
}

/**
 * Fixture rows carry the reader-visible task surface (identityId,
 * sourceEntityId, sourceModule, nextRunAt, enabled, status). They are stored
 * as plain rows so snooze/pause/commit can advance BOTH authorities in
 * lockstep; findDueTasksForExecution resolves them as ScheduleTask[] exactly
 * like the production IScheduleTaskRepository contract.
 */
interface TaskRow {
  identityId: string;
  sourceEntityId: string;
  sourceModule: string;
  nextRunAt: Date | null;
  enabled: boolean;
  status: string;
}

function asScheduleTasks(rows: TaskRow[]): ScheduleTask[] {
  return rows as unknown as ScheduleTask[];
}

interface ParityHarness {
  templates: TemplateRow[];
  tasks: TaskRow[];
  legacyRepository: { findByNextTriggerBefore: ReturnType<typeof vi.fn> };
  scheduleTaskRepository: { findDueTasksForExecution: ReturnType<typeof vi.fn> };
  schedulerDueSetReader: ReturnType<typeof createReminderSchedulerDueSetReader>;
  upsert: (id: string, dueAt: number, enabled?: boolean) => void;
  snooze: (id: string, untilMs: number) => void;
  pause: (id: string) => void;
  commit: (id: string, nextDueAt: number | null) => void;
}

function templateRow(id: string, dueAt: number | null): TemplateRow {
  return {
    id,
    identityId: IDENTITY,
    nextTriggerAt: dueAt,
    selfEnabled: true,
    status: 'Active',
    deletedAt: null,
  };
}

function taskRow(id: string, dueAt: Date | null, enabled = true): TaskRow {
  return {
    identityId: IDENTITY,
    sourceEntityId: id,
    sourceModule: SourceModule.Reminder,
    nextRunAt: dueAt,
    enabled,
    status: 'Active',
  };
}

function createParityHarness(): ParityHarness {
  const templates: TemplateRow[] = [];
  const tasks: TaskRow[] = [];
  // Mirrors the Prisma predicate of findByNextTriggerBefore: only effective
  // Active templates with a due nextTriggerAt enter the former-cron due set.
  const legacyRepository = {
    findByNextTriggerBefore: vi.fn((beforeTime: number) =>
      templates.filter(
        (t) =>
          t.selfEnabled &&
          t.status === 'Active' &&
          !t.deletedAt &&
          t.nextTriggerAt !== null &&
          t.nextTriggerAt <= beforeTime,
      ),
    ),
  };
  // Mirrors findDueTasksForExecution (async Promise<ScheduleTask[]> as the
  // production IScheduleTaskRepository contract demands); the real reader then
  // narrows to the Reminder source after the query, so the test also exercises
  // that filter.
  const scheduleTaskRepository = {
    findDueTasksForExecution: vi.fn(
      async (beforeDate: Date): Promise<ScheduleTask[]> =>
        asScheduleTasks(
          tasks.filter(
            (t) =>
              t.enabled &&
              t.status === 'Active' &&
              t.nextRunAt !== null &&
              t.nextRunAt.getTime() <= beforeDate.getTime(),
          ),
        ),
    ),
  };

  return {
    templates,
    tasks,
    legacyRepository,
    scheduleTaskRepository,
    schedulerDueSetReader: createReminderSchedulerDueSetReader(scheduleTaskRepository),
    upsert(id, dueAt, enabled = true) {
      templates.push(templateRow(id, dueAt));
      tasks.push(taskRow(id, new Date(dueAt), enabled));
    },
    snooze(id, untilMs) {
      const template = templates.find((t) => t.id === id);
      const task = tasks.find((t) => t.sourceEntityId === id);
      if (template) template.nextTriggerAt = untilMs;
      if (task) task.nextRunAt = new Date(untilMs);
    },
    pause(id) {
      const template = templates.find((t) => t.id === id);
      const task = tasks.find((t) => t.sourceEntityId === id);
      if (template) {
        template.selfEnabled = false;
        template.status = 'Paused';
      }
      if (task) {
        task.enabled = false;
        task.status = 'Disabled';
      }
    },
    commit(id, nextDueAt) {
      const template = templates.find((t) => t.id === id);
      const task = tasks.find((t) => t.sourceEntityId === id);
      if (template) template.nextTriggerAt = nextDueAt;
      if (task) task.nextRunAt = nextDueAt === null ? null : new Date(nextDueAt);
    },
  };
}

async function runShadowScan(
  harness: ParityHarness,
  checkedAt: number,
): Promise<ReminderDueSetComparison> {
  let comparison: ReminderDueSetComparison | undefined;
  const runtime = createReminderTriggerCronRuntime({
    reminderTemplateRepository: harness.legacyRepository as never,
    schedulerDueSetReader: harness.schedulerDueSetReader,
    maxCount: 100,
    now: () => checkedAt,
    onComparison: (c: ReminderDueSetComparison) => {
      comparison = c;
    },
  }) as { execute(): Promise<void> };

  await runtime.execute();
  expect(comparison).toBeDefined();
  return comparison!;
}

function expectEquivalentDueSets(comparison: ReminderDueSetComparison): void {
  expect(comparison.matched).toBe(true);
  expect(comparison.legacyOnly).toEqual([]);
  expect(comparison.schedulerOnly).toEqual([]);
  expect(comparison.timingMismatches).toEqual([]);
  expect(comparison.duplicateLegacyKeys).toEqual([]);
  expect(comparison.duplicateSchedulerKeys).toEqual([]);
  expect(comparison.legacyCount).toBe(comparison.schedulerCount);
}

describe('reminder due-set shadow parity (ROUTINE-3402)', () => {
  it('reports equivalent due sets across a shadow-host and worker restart', async () => {
    const harness = createParityHarness();
    harness.upsert('r1', T0 - 5 * MINUTE_MS);
    harness.upsert('r2', T0 + 30 * MINUTE_MS);

    const beforeRestart = await runShadowScan(harness, T0);
    expectEquivalentDueSets(beforeRestart);
    expect(beforeRestart.legacyCount).toBe(1);

    // Restart is transparent to the due sets: the shadow runtime is recreated
    // over the same durable stores and both authorities re-read from scratch.
    const afterRestart = await runShadowScan(harness, T0);
    expectEquivalentDueSets(afterRestart);
    expect(afterRestart.legacyCount).toBe(beforeRestart.legacyCount);
    expect(afterRestart.schedulerCount).toBe(beforeRestart.schedulerCount);

    // The restarted worker commits the occurrence and advances BOTH
    // authorities in the same atomic business commit, so the next scan over
    // the new cycle still matches.
    harness.commit('r1', T0 + 60 * MINUTE_MS);
    const nextCycle = await runShadowScan(harness, T0 + MINUTE_MS);
    expectEquivalentDueSets(nextCycle);
    expect(nextCycle.legacyCount).toBe(0);
  });

  it('reports equivalent due sets when snooze postpones both authorities', async () => {
    const harness = createParityHarness();
    harness.upsert('r1', T0 - MINUTE_MS);
    harness.upsert('r2', T0 - 30_000);

    expectEquivalentDueSets(await runShadowScan(harness, T0));

    harness.snooze('r1', T0 + 60 * MINUTE_MS);
    const duringSnooze = await runShadowScan(harness, T0 + 5 * MINUTE_MS);
    expectEquivalentDueSets(duringSnooze);
    expect(duringSnooze.legacyCount).toBe(1);

    const afterSnooze = await runShadowScan(harness, T0 + 65 * MINUTE_MS);
    expectEquivalentDueSets(afterSnooze);
    expect(afterSnooze.legacyCount).toBe(2);
    expect(afterSnooze.timingMismatches).toEqual([]);
  });

  it('reports equivalent (empty) due sets when a reminder is paused', async () => {
    const harness = createParityHarness();
    harness.upsert('r1', T0 - MINUTE_MS);

    expectEquivalentDueSets(await runShadowScan(harness, T0));

    harness.pause('r1');
    const paused = await runShadowScan(harness, T0 + MINUTE_MS);
    expectEquivalentDueSets(paused);
    expect(paused.legacyCount).toBe(0);
    expect(paused.schedulerCount).toBe(0);

    const muchLater = await runShadowScan(harness, T0 + 24 * 60 * MINUTE_MS);
    expectEquivalentDueSets(muchLater);
  });

  it('reports identical due sets from two concurrent shadow workers', async () => {
    const harness = createParityHarness();
    harness.upsert('r1', T0 - MINUTE_MS);
    harness.upsert('r2', T0 - 30_000);
    harness.upsert('r3', T0 + 5 * MINUTE_MS);

    const [workerA, workerB] = await Promise.all([
      runShadowScan(harness, T0),
      runShadowScan(harness, T0),
    ]);
    expectEquivalentDueSets(workerA);
    expectEquivalentDueSets(workerB);
    expect(workerA.legacyCount).toBe(2);
    expect(workerA.schedulerCount).toBe(2);
    expect(workerA.legacyOnly).toEqual(workerB.legacyOnly);
    expect(workerA.schedulerOnly).toEqual(workerB.schedulerOnly);

    // Worker A wins the fence and commits; worker B observes the same advanced
    // due set on its next scan (no duplicate/stale projection, no divergence).
    harness.commit('r1', T0 + 60 * MINUTE_MS);
    const workerBAfterA = await runShadowScan(harness, T0 + 2 * MINUTE_MS);
    expectEquivalentDueSets(workerBAfterA);
    // r1 advanced past the scan window; r2 stays due on both sides.
    expect(workerBAfterA.legacyCount).toBe(1);
    expect(workerBAfterA.schedulerCount).toBe(1);
    expect(workerBAfterA.timingMismatches).toEqual([]);
  });

  it('truncates both sides identically at the comparison limit', async () => {
    const harness = createParityHarness();
    harness.upsert('r1', T0 - MINUTE_MS);
    harness.upsert('r2', T0 - 30_000);
    harness.upsert('r3', T0 - 10_000);

    let comparison: ReminderDueSetComparison | undefined;
    const runtime = createReminderTriggerCronRuntime({
      reminderTemplateRepository: harness.legacyRepository as never,
      schedulerDueSetReader: harness.schedulerDueSetReader,
      maxCount: 2,
      now: () => T0,
      onComparison: (c: ReminderDueSetComparison) => {
        comparison = c;
      },
    }) as { execute(): Promise<void> };

    await runtime.execute();
    expectEquivalentDueSets(comparison!);
    expect(comparison!.legacyCount).toBe(2);
    expect(comparison!.schedulerCount).toBe(2);
  });

  it('surfaces a mismatch when the Scheduler drifts from the former cron due set', async () => {
    const harness = createParityHarness();
    harness.upsert('r1', T0 - MINUTE_MS);
    harness.snooze('r1', T0 + 60 * MINUTE_MS);
    // Scheduler-side drift: the projected task re-points at the old due time
    // while the legacy template row already moved to the snoozed time.
    const task = harness.tasks.find((t) => t.sourceEntityId === 'r1')!;
    task.nextRunAt = new Date(T0 - MINUTE_MS);

    const drifted = await runShadowScan(harness, T0);
    expect(drifted.matched).toBe(false);
    expect(drifted.schedulerOnly).toEqual([
      { identityId: IDENTITY, reminderId: 'r1', dueAt: T0 - MINUTE_MS },
    ]);
    expect(drifted.legacyOnly).toEqual([]);
    expect(drifted.timingMismatches).toEqual([]);
  });
});