import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@memoflow/contracts/schedule';
import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@memoflow/contracts/notification';
import { ScheduleTask } from '@memoflow/schedule';
import { createReminderScheduleExecutionSource } from './schedule-execution-source';

function createScheduleTask() {
  return ScheduleTask.create({
    identityId: 'IdentityId_reminder-owner',
    name: 'Reminder Trigger',
    sourceModule: SourceModule.Reminder,
    sourceEntityId: 'ReminderTemplateId_template-1',
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: {
      payload: {},
      tags: ['reminder'],
      priority: 'Normal',
      timeout: null,
    },
  });
}

describe('createReminderScheduleExecutionSource', () => {
  it('records the trigger and builds a notification draft', async () => {
    const recordTrigger = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    const findByIdForIdentity = vi.fn().mockResolvedValue({
      id: 'ReminderTemplateId_template-1',
      identityId: 'IdentityId_reminder-owner',
      title: 'Drink Water',
      description: 'Hydrate',
      deletedAt: null,
      nextTriggerAt: 1894257900000,
      notificationConfig: {
        title: null,
        body: 'Hydrate',
        channels: ['Push'],
      },
      isEffectivelyEnabled: () => true,
      recordTrigger,
    });
    const source = createReminderScheduleExecutionSource({
      reminderTemplateRepository: {
        findByIdForIdentity,
        save,
      },
    });

    const task = createScheduleTask();
    const outcome = await source.executeReminder(task);

    expect(findByIdForIdentity).toHaveBeenCalledWith(
      String(task.identityId),
      'ReminderTemplateId_template-1',
      { includeHistory: true },
    );
    expect(recordTrigger).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({
      nextRunAt: 1894257900000,
      notification: {
        identityId: 'IdentityId_reminder-owner',
        title: 'Drink Water',
        content: 'Hydrate',
        type: NotificationType.Reminder,
        category: NotificationCategory.Reminder,
        relatedEntityType: RelatedEntityType.Reminder,
        relatedEntityId: 'ReminderTemplateId_template-1',
        channels: [NotificationChannelType.Push],
      },
      result: {
        reminderId: 'ReminderTemplateId_template-1',
        reminderTitle: 'Drink Water',
      },
    });
  });
});
