import { describe, expect, it, vi } from 'vitest';
import { ReminderType } from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { createReminderScheduleProjectionSource } from './schedule-projection-source';

describe('createReminderScheduleProjectionSource', () => {
  it('builds a schedule task for an enabled reminder template with nextTriggerAt', async () => {
    const source = createReminderScheduleProjectionSource({
      reminderTemplateRepository: {
        findById: vi.fn().mockResolvedValue({
          id: 'ReminderTemplateId_template-1',
          identityId: 'IdentityId_reminder-owner',
          title: 'Pay rent',
          description: 'Monthly rent reminder',
          type: ReminderType.OneTime,
          deletedAt: null,
          nextTriggerAt: new Date('2030-01-15T08:00:00.000Z').getTime(),
          trigger: { fixedTime: { timezone: 'Asia/Shanghai' } },
          isEffectivelyEnabled: vi.fn().mockReturnValue(true),
        }),
      } as never,
    });

    const plan = await source.buildTemplatePlan(
      'ReminderTemplateId_template-1',
      'IdentityId_reminder-owner',
    );

    expect(plan.selection.sourceModule).toBe(SourceModule.Reminder);
    expect(plan.selection.sourceEntityId).toBe('ReminderTemplateId_template-1');
    expect(plan.nextTasks).toHaveLength(1);
    expect(plan.nextTasks[0]?.sourceEntityId).toBe('ReminderTemplateId_template-1');
    expect(plan.nextTasks[0]?.metadata.payload['reminderId']).toBe(
      'ReminderTemplateId_template-1',
    );
  });
});
