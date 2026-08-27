import { describe, expect, it, vi } from 'vitest';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import { createReminderScheduleExecutionSource } from './schedule-execution-source';

function createScheduleTask() {
  return {
    identityId: 'IdentityId_reminder-owner',
    sourceEntityId: 'ReminderTemplateId_template-1',
    nextRunAt: new Date('2030-01-10T08:45:00.000Z'),
  };
}

describe('createReminderScheduleExecutionSource (NOTIF-3302)', () => {
  it('commits trigger state + canonical NotificationRequested through the Reminder-owned boundary', async () => {
    const task = createScheduleTask();
    const scheduledFor = Date.parse('2030-01-10T08:45:00.000Z');
    const recordTrigger = vi.fn();
    const reminder = {
      id: 'ReminderTemplateId_template-1',
      identityId: 'IdentityId_reminder-owner',
      title: 'Drink Water',
      description: 'Hydrate',
      deletedAt: null,
      nextTriggerAt: scheduledFor,
      notificationConfig: { title: null, body: 'Hydrate', channels: ['Push'] },
      isEffectivelyEnabled: () => true,
      recordTrigger: () => {
        recordTrigger();
        reminder.nextTriggerAt = scheduledFor + 60_000;
      },
    };
    const findByIdForIdentity = vi.fn().mockResolvedValue(reminder);
    const commit = vi.fn().mockImplementation(async (input) => ({
      applied: true,
      nextRunAt: input.template.nextTriggerAt,
      notificationOperationId: input.notificationRequested.operationId,
    }));
    const source = createReminderScheduleExecutionSource({
      reminderTemplateRepository: { findByIdForIdentity },
      commitPort: { commit },
    });

    const outcome = await source.executeReminder(task);

    expect(recordTrigger).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
    const committed = commit.mock.calls[0]![0];
    expect(committed.expectedNextTriggerAt).toBe(scheduledFor);
    expect(committed.notificationRequested).toMatchObject({
      operationId: `reminder-trigger:ReminderTemplateId_template-1:${scheduledFor}`,
      envelope: {
        identityId: 'IdentityId_reminder-owner',
        source: 'reminder',
        workflowKey: 'reminder.trigger',
        relatedEntity: { id: 'ReminderTemplateId_template-1' },
        content: { title: 'Drink Water', content: 'Hydrate' },
        suggestedChannels: [NotificationChannelType.Push],
      },
    });
    expect(outcome).toEqual({
      nextRunAt: scheduledFor + 60_000,
      result: {
        reminderId: 'ReminderTemplateId_template-1',
        reminderTitle: 'Drink Water',
        notificationOperationId: `reminder-trigger:ReminderTemplateId_template-1:${scheduledFor}`,
      },
    });
    expect(outcome).not.toHaveProperty('notification');
  });

  it('does not replay business side effects after the Reminder aggregate already advanced', async () => {
    const task = createScheduleTask();
    const scheduledFor = Date.parse('2030-01-10T08:45:00.000Z');
    const recordTrigger = vi.fn();
    const commit = vi.fn();
    const source = createReminderScheduleExecutionSource({
      reminderTemplateRepository: {
        findByIdForIdentity: vi.fn().mockResolvedValue({
          id: 'ReminderTemplateId_template-1',
          identityId: 'IdentityId_reminder-owner',
          title: 'Drink Water',
          description: null,
          deletedAt: null,
          nextTriggerAt: scheduledFor + 60_000,
          notificationConfig: { title: null, body: null, channels: [] },
          isEffectivelyEnabled: () => true,
          recordTrigger,
        }),
      },
      commitPort: { commit },
    });

    await expect(source.executeReminder(task)).resolves.toEqual({
      nextRunAt: scheduledFor + 60_000,
      result: {
        skipped: true,
        reason: 'STALE_SCHEDULE_OCCURRENCE',
        reminderId: 'ReminderTemplateId_template-1',
      },
    });
    expect(recordTrigger).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });
});
