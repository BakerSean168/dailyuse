import { describe, expect, it, vi } from 'vitest';
import { ReminderType } from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { createReminderScheduleProjectionSource } from './schedule-projection-source';

describe('createReminderScheduleProjectionSource', () => {
  it('builds a schedule task for an enabled reminder template with nextTriggerAt', async () => {
    const template = {
      id: 'ReminderTemplateId_template-1',
      identityId: 'IdentityId_reminder-owner',
      title: 'Pay rent',
      description: 'Monthly rent reminder',
      type: ReminderType.OneTime,
      deletedAt: null,
      nextTriggerAt: new Date('2030-01-15T08:00:00.000Z').getTime(),
      trigger: { fixedTime: { timezone: 'Asia/Shanghai' } },
      isEffectivelyEnabled: vi.fn().mockReturnValue(true),
    };
    const findByIdForIdentity = vi.fn().mockResolvedValue(template);
    const findById = vi.fn();

    const source = createReminderScheduleProjectionSource({
      reminderTemplateRepository: {
        findById,
        findByIdForIdentity,
      } as never,
    });

    const plan = await source.buildTemplatePlan(
      'ReminderTemplateId_template-1',
      'IdentityId_reminder-owner',
    );

    expect(findByIdForIdentity).toHaveBeenCalledWith(
      'IdentityId_reminder-owner',
      'ReminderTemplateId_template-1',
      { includeHistory: true },
    );
    expect(findById).not.toHaveBeenCalled();
    expect(plan.selection.sourceModule).toBe(SourceModule.Reminder);
    expect(plan.selection.sourceEntityId).toBe('ReminderTemplateId_template-1');
    expect(plan.nextTasks).toHaveLength(1);
    expect(plan.nextTasks[0]?.sourceEntityId).toBe('ReminderTemplateId_template-1');
    expect(plan.nextTasks[0]?.metadata.payload['reminderId']).toBe(
      'ReminderTemplateId_template-1',
    );
  });

  it('falls back to bare findById when identity is omitted', async () => {
    const findById = vi.fn().mockResolvedValue(null);
    const findByIdForIdentity = vi.fn();
    const source = createReminderScheduleProjectionSource({
      reminderTemplateRepository: {
        findById,
        findByIdForIdentity,
      } as never,
    });

    const plan = await source.buildTemplatePlan('ReminderTemplateId_missing');

    expect(findById).toHaveBeenCalledWith('ReminderTemplateId_missing', {
      includeHistory: true,
    });
    expect(findByIdForIdentity).not.toHaveBeenCalled();
    expect(plan.nextTasks).toEqual([]);
  });
});
