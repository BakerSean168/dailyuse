import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { NotificationCategory, NotificationChannelType, NotificationType, RelatedEntityType } from '@dailyuse/contracts/notification';
import { ScheduleTask } from '@dailyuse/schedule';
import { createTaskScheduleExecutionSource } from './schedule-execution-source';

function createScheduleTask(payload: Record<string, unknown> = {}) {
  return ScheduleTask.create({
    identityId: 'IdentityId_task-owner',
    name: 'Task Reminder',
    sourceModule: SourceModule.Task,
    sourceEntityId: 'TaskInstanceId_instance-1',
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: {
      payload,
      tags: ['task'],
      priority: 'Normal',
      timeout: null,
    },
  });
}

describe('createTaskScheduleExecutionSource', () => {
  it('builds a notification draft for executable task reminders', async () => {
    const findInstanceByIdForIdentity = vi.fn().mockResolvedValue({
      id: 'TaskInstanceId_instance-1',
      identityId: 'IdentityId_task-owner',
      templateId: 'TaskTemplateId_template-1',
      deletedAt: null,
      status: 'Pending',
    });
    const findTemplateByIdForIdentity = vi.fn().mockResolvedValue({
      id: 'TaskTemplateId_template-1',
      title: 'Write Tests',
    });
    const source = createTaskScheduleExecutionSource({
      taskInstanceRepository: {
        findById: vi.fn(),
        findByIdForIdentity: findInstanceByIdForIdentity,
      },
      taskTemplateRepository: {
        findById: vi.fn(),
        findByIdForIdentity: findTemplateByIdForIdentity,
      },
    });

    const task = createScheduleTask({
      reminderType: 'Relative',
      reminderValue: 15,
      reminderUnit: '分钟',
    });
    const outcome = await source.executeTask(task);

    expect(findInstanceByIdForIdentity).toHaveBeenCalledWith(
      String(task.identityId),
      'TaskInstanceId_instance-1',
    );
    expect(findTemplateByIdForIdentity).toHaveBeenCalledWith(
      String(task.identityId),
      'TaskTemplateId_template-1',
    );
    expect(outcome).toEqual({
      nextRunAt: null,
      notification: {
        identityId: 'IdentityId_task-owner',
        title: '任务提醒：Write Tests',
        content: '任务「Write Tests」的提前 15分钟 提醒已到达。',
        type: NotificationType.Reminder,
        category: NotificationCategory.Task,
        relatedEntityType: RelatedEntityType.Task,
        relatedEntityId: 'TaskInstanceId_instance-1',
        channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
      },
      result: {
        instanceId: 'TaskInstanceId_instance-1',
        templateId: 'TaskTemplateId_template-1',
        taskTitle: 'Write Tests',
        reminderType: 'Relative',
        reminderValue: 15,
        reminderUnit: '分钟',
      },
    });
  });

  it('skips when identity-scoped instance load returns null', async () => {
    const findInstanceByIdForIdentity = vi.fn().mockResolvedValue(null);
    const findTemplateByIdForIdentity = vi.fn();
    const source = createTaskScheduleExecutionSource({
      taskInstanceRepository: {
        findById: vi.fn(),
        findByIdForIdentity: findInstanceByIdForIdentity,
      },
      taskTemplateRepository: {
        findById: vi.fn(),
        findByIdForIdentity: findTemplateByIdForIdentity,
      },
    });

    const outcome = await source.executeTask(createScheduleTask());

    expect(findInstanceByIdForIdentity).toHaveBeenCalled();
    expect(findTemplateByIdForIdentity).not.toHaveBeenCalled();
    expect(outcome).toEqual({ nextRunAt: null, result: { skipped: true } });
  });
});
