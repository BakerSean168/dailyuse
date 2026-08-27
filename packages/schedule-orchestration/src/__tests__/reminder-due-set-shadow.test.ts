import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@memoflow/contracts/schedule';
import { createReminderSchedulerDueSetReader } from '../shadow/reminder-due-set-shadow';

function task(params: {
  sourceModule: SourceModule;
  sourceEntityId: string;
  identityId?: string;
  dueAt?: number | null;
}) {
  return {
    sourceModule: params.sourceModule,
    sourceEntityId: params.sourceEntityId,
    identityId: params.identityId ?? 'identity-1',
    nextRunAt: params.dueAt === null ? null : new Date(params.dueAt ?? 1_000),
  } as never;
}

describe('createReminderSchedulerDueSetReader (ROUTINE-3402)', () => {
  it('reads only Reminder ScheduleTasks and preserves the projected due timestamp', async () => {
    const findDueTasksForExecution = vi.fn(async () => [
      task({ sourceModule: SourceModule.Task, sourceEntityId: 'task-1' }),
      task({ sourceModule: SourceModule.Reminder, sourceEntityId: 'reminder-1', dueAt: 5_000 }),
      task({ sourceModule: SourceModule.Goal, sourceEntityId: 'goal-1' }),
      task({ sourceModule: SourceModule.Reminder, sourceEntityId: 'disabled-next', dueAt: null }),
    ]);
    const reader = createReminderSchedulerDueSetReader({ findDueTasksForExecution });

    await expect(reader.readDueSet(10_000, 100)).resolves.toEqual([
      { identityId: 'identity-1', reminderId: 'reminder-1', dueAt: 5_000 },
    ]);
    expect(findDueTasksForExecution).toHaveBeenCalledWith(new Date(10_000));
  });

  it('applies the comparison limit after filtering unrelated due work', async () => {
    const findDueTasksForExecution = vi.fn(async () => [
      ...Array.from({ length: 20 }, (_, i) =>
        task({ sourceModule: SourceModule.Task, sourceEntityId: `task-${i}` }),
      ),
      task({ sourceModule: SourceModule.Reminder, sourceEntityId: 'r2', dueAt: 1_000 }),
      task({ sourceModule: SourceModule.Reminder, sourceEntityId: 'r1', dueAt: 1_000 }),
    ]);
    const reader = createReminderSchedulerDueSetReader({ findDueTasksForExecution });

    const result = await reader.readDueSet(10_000, 1);
    expect(result).toEqual([{ identityId: 'identity-1', reminderId: 'r1', dueAt: 1_000 }]);
  });
});
