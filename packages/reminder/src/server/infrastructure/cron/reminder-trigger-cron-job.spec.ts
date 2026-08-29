import { describe, expect, it, vi } from 'vitest';
import {
  compareReminderDueSets,
  createReminderTriggerCronJob,
  type ReminderDueSetEntry,
} from './reminder-trigger-cron-job';

const checkedAt = Date.parse('2026-08-27T00:00:00.000Z');

function entry(reminderId: string, dueAt = checkedAt - 1_000): ReminderDueSetEntry {
  return { identityId: 'identity-1', reminderId, dueAt };
}

describe('compareReminderDueSets (ROUTINE-3402)', () => {
  it('matches the same due identity and timestamp', () => {
    expect(
      compareReminderDueSets({ checkedAt, legacy: [entry('r1')], scheduler: [entry('r1')] }),
    ).toMatchObject({
      matched: true,
      legacyCount: 1,
      schedulerCount: 1,
      legacyOnly: [],
      schedulerOnly: [],
      timingMismatches: [],
    });
  });

  it('reports legacy-only, scheduler-only and snooze timing mismatches', () => {
    const result = compareReminderDueSets({
      checkedAt,
      legacy: [entry('legacy-only'), entry('snoozed', checkedAt - 10_000)],
      scheduler: [entry('scheduler-only'), entry('snoozed', checkedAt - 5_000)],
    });

    expect(result.matched).toBe(false);
    expect(result.legacyOnly).toEqual([entry('legacy-only')]);
    expect(result.schedulerOnly).toEqual([entry('scheduler-only')]);
    expect(result.timingMismatches).toEqual([
      {
        identityId: 'identity-1',
        reminderId: 'snoozed',
        legacyDueAt: checkedAt - 10_000,
        schedulerDueAt: checkedAt - 5_000,
      },
    ]);
  });

  it('treats duplicate Scheduler projection as a mismatch instead of a false match', () => {
    const result = compareReminderDueSets({
      checkedAt,
      legacy: [entry('r1')],
      scheduler: [entry('r1'), entry('r1')],
    });

    expect(result.matched).toBe(false);
    expect(result.duplicateSchedulerKeys).toHaveLength(1);
    expect(result.schedulerOnly).toHaveLength(1);
  });

  it('considers a paused reminder clean when neither authority reports it due', () => {
    expect(compareReminderDueSets({ checkedAt, legacy: [], scheduler: [] }).matched).toBe(true);
  });
});

describe('createReminderTriggerCronJob read-only shadow', () => {
  it('reads and compares due sets without saving, claiming, advancing or dispatching', async () => {
    const findByNextTriggerBefore = vi.fn(async () => [
      {
        id: 'r1',
        identityId: 'identity-1',
        nextTriggerAt: checkedAt - 1_000,
      },
    ]);
    const readDueSet = vi.fn(async () => [entry('r1')]);
    const onComparison = vi.fn();
    const job = createReminderTriggerCronJob({
      reminderTemplateRepository: { findByNextTriggerBefore } as never,
      schedulerDueSetReader: { readDueSet },
      now: () => checkedAt,
      onComparison,
    });

    await job.execute?.();

    expect(findByNextTriggerBefore).toHaveBeenCalledWith(checkedAt);
    expect(readDueSet).toHaveBeenCalledWith(checkedAt, 100);
    expect(onComparison).toHaveBeenCalledWith(expect.objectContaining({ matched: true }));
  });

  it('applies a deterministic dueAt + identity/reminder ordering before maxCount truncation', async () => {
    const onComparison = vi.fn();
    const job = createReminderTriggerCronJob({
      reminderTemplateRepository: {
        findByNextTriggerBefore: vi.fn(async () => [
          { id: 'r2', identityId: 'identity-1', nextTriggerAt: checkedAt - 1_000 },
          { id: 'r1', identityId: 'identity-1', nextTriggerAt: checkedAt - 1_000 },
        ]),
      } as never,
      schedulerDueSetReader: { readDueSet: vi.fn(async () => [entry('r1')]) },
      maxCount: 1,
      now: () => checkedAt,
      onComparison,
    });

    await job.execute?.();

    expect(onComparison).toHaveBeenCalledWith(expect.objectContaining({ matched: true }));
  });

  it('is observation-only even when the sets mismatch', async () => {
    const onComparison = vi.fn();
    const job = createReminderTriggerCronJob({
      reminderTemplateRepository: {
        findByNextTriggerBefore: vi.fn(async () => [
          { id: 'r1', identityId: 'identity-1', nextTriggerAt: checkedAt - 1_000 },
        ]),
      } as never,
      schedulerDueSetReader: { readDueSet: vi.fn(async () => []) },
      now: () => checkedAt,
      onComparison,
    });

    await job.execute?.();

    expect(onComparison).toHaveBeenCalledWith(
      expect.objectContaining({ matched: false, legacyCount: 1, schedulerCount: 0 }),
    );
  });
});
