import { describe, expect, it, vi } from 'vitest';
import { SourceModule, type SourceModule as SourceModuleValue } from '@memoflow/contracts/schedule';
import { ScheduleTask } from '@memoflow/schedule';
import { createScheduleExecutionRouter } from '../execution/router';

function createScheduleTask(sourceModule: SourceModuleValue) {
  return ScheduleTask.create({
    identityId: 'IdentityId_schedule-owner',
    name: 'Execution Router Test',
    sourceModule,
    sourceEntityId: 'entity-1',
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: { payload: {}, tags: ['test'], priority: 'Normal', timeout: null },
  });
}

describe('schedule execution router (NOTIF-3302)', () => {
  it.each([
    [SourceModule.Reminder, 'executeReminder'],
    [SourceModule.Goal, 'executeGoal'],
    [SourceModule.Task, 'executeTask'],
  ] as const)(
    'routes %s and returns the business source result unchanged',
    async (sourceModule, method) => {
      const outcome = { nextRunAt: null, result: { ok: sourceModule } };
      const reminderSource = { executeReminder: vi.fn().mockResolvedValue(outcome) };
      const goalSource = { executeGoal: vi.fn().mockResolvedValue(outcome) };
      const taskSource = { executeTask: vi.fn().mockResolvedValue(outcome) };
      const router = createScheduleExecutionRouter({ reminderSource, goalSource, taskSource });
      const task = createScheduleTask(sourceModule);

      await expect(router.execute(task)).resolves.toEqual(outcome);
      const source = {
        executeReminder: reminderSource.executeReminder,
        executeGoal: goalSource.executeGoal,
        executeTask: taskSource.executeTask,
      }[method];
      expect(source).toHaveBeenCalledWith(task);
    },
  );

  it('throws for unsupported schedule source modules', async () => {
    const router = createScheduleExecutionRouter({
      reminderSource: { executeReminder: vi.fn() },
      goalSource: { executeGoal: vi.fn() },
      taskSource: { executeTask: vi.fn() },
    });
    await expect(router.execute(createScheduleTask(SourceModule.Custom))).rejects.toThrow(
      'Unsupported schedule source module: Custom',
    );
  });
});
