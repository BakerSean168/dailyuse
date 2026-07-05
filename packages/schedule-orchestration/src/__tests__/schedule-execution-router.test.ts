import { describe, expect, it, vi } from 'vitest';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import { SourceModule, type SourceModule as SourceModuleValue } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import { ScheduleConfig, ScheduleTaskMetadata } from '@dailyuse/schedule/domain-shared';
import { createScheduleExecutionRouter } from '../execution/router';

function createScheduleTask(sourceModule: SourceModuleValue) {
  return ScheduleTask.create({
    identityId: 'IdentityId_schedule-owner',
    name: 'Execution Router Test',
    sourceModule,
    sourceEntityId: 'entity-1',
    schedule: ScheduleConfig.fromDTO({
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    }),
    metadata: ScheduleTaskMetadata.create({
      payload: {},
      tags: ['test'],
      priority: 'Normal',
      timeout: null,
    }),
  });
}

describe('schedule execution router', () => {
  it('routes task execution and delegates notification creation', async () => {
    const notificationPort = {
      createNotification: vi.fn().mockResolvedValue(undefined),
    };

    const router = createScheduleExecutionRouter({
      reminderSource: {
        executeReminder: vi.fn(),
      },
      goalSource: {
        executeGoal: vi.fn(),
      },
      taskSource: {
        executeTask: vi.fn().mockResolvedValue({
          nextRunAt: null,
          notification: {
            identityId: 'IdentityId_schedule-owner',
            title: '任务提醒：Execution Router Test',
            content: 'Task content',
            type: NotificationType.Reminder,
            category: NotificationCategory.Task,
          },
          result: { ok: true },
        }),
      },
      notificationPort,
    });

    const task = createScheduleTask(SourceModule.Task);
    const result = await router.execute(task);

    expect(result).toEqual({
      nextRunAt: null,
      result: { ok: true },
    });
    expect(notificationPort.createNotification).toHaveBeenCalledWith({
      identityId: 'IdentityId_schedule-owner',
      title: '任务提醒：Execution Router Test',
      content: 'Task content',
      type: NotificationType.Reminder,
      category: NotificationCategory.Task,
    });
  });

  it('throws for unsupported schedule source modules', async () => {
    const router = createScheduleExecutionRouter({
      reminderSource: {
        executeReminder: vi.fn(),
      },
      goalSource: {
        executeGoal: vi.fn(),
      },
      taskSource: {
        executeTask: vi.fn(),
      },
      notificationPort: {
        createNotification: vi.fn(),
      },
    });

    await expect(router.execute(createScheduleTask(SourceModule.Custom))).rejects.toThrow(
      'Unsupported schedule source module: Custom',
    );
  });
});
