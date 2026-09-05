import { describe, expect, it, vi } from 'vitest';
import { ReminderType } from '@memoflow/contracts/reminder';
import { buildSchedulingKey } from '@memoflow/contracts/schedule';
import {
  REMINDER_SCHEDULING_OWNER_TYPE,
  REMINDER_TEMPLATE_HANDLER_KEY,
  REMINDER_TEMPLATE_PAYLOAD_VERSION,
  createReminderScheduleProjectionEventHandlers,
  createReminderScheduleProjectionSource,
} from './schedule-projection-source';

describe('createReminderScheduleProjectionSource', () => {
  it('projects enabled reminder business truth into one neutral ScheduledIntent', async () => {
    const nextTriggerAt = Date.parse('2030-01-15T08:00:00.000Z');
    const template = {
      id: 'ReminderTemplateId_template-1',
      identityId: 'IdentityId_reminder-owner',
      title: 'Pay rent',
      description: 'Monthly rent reminder',
      type: ReminderType.OneTime,
      deletedAt: null,
      nextTriggerAt,
      version: 7,
      isEffectivelyEnabled: vi.fn().mockReturnValue(true),
    };
    const findByIdForIdentity = vi.fn().mockResolvedValue(template);
    const source = createReminderScheduleProjectionSource({
      reminderTemplateRepository: {
        findByIdForIdentity,
        findAllTemplateRefs: vi.fn().mockResolvedValue([]),
      },
    });

    const plan = await source.buildTemplatePlan(template.id, template.identityId);

    expect(findByIdForIdentity).toHaveBeenCalledWith(template.identityId, template.id);
    expect(plan.owner).toEqual({
      identityId: template.identityId,
      type: REMINDER_SCHEDULING_OWNER_TYPE,
      id: template.id,
    });
    expect(plan.desired).toEqual([
      expect.objectContaining({
        schedulingKey: buildSchedulingKey('reminder.template', template.id, String(nextTriggerAt)),
        handlerKey: REMINDER_TEMPLATE_HANDLER_KEY,
        runAt: nextTriggerAt,
        payloadVersion: REMINDER_TEMPLATE_PAYLOAD_VERSION,
        payload: { templateId: template.id, scheduledFor: nextTriggerAt },
        sourceRevision: 7,
      }),
    ]);
    expect(JSON.stringify(plan)).not.toContain('sourceModule');
  });

  it('returns an empty desired set for missing or non-fireable templates', async () => {
    const findByIdForIdentity = vi.fn().mockResolvedValue(null);
    const source = createReminderScheduleProjectionSource({
      reminderTemplateRepository: {
        findByIdForIdentity,
        findAllTemplateRefs: vi.fn().mockResolvedValue([]),
      },
    });

    await expect(
      source.buildTemplatePlan('ReminderTemplateId_missing', 'IdentityId_reminder-owner'),
    ).resolves.toEqual({
      owner: {
        identityId: 'IdentityId_reminder-owner',
        type: REMINDER_SCHEDULING_OWNER_TYPE,
        id: 'ReminderTemplateId_missing',
      },
      desired: [],
    });
  });

  it('enumerates durable authority refs for startup lost-event repair', async () => {
    const findAllTemplateRefs = vi.fn().mockResolvedValue([
      { id: 'ReminderTemplateId_a', identityId: 'IdentityId_1' },
      { id: 'ReminderTemplateId_b', identityId: 'IdentityId_2' },
    ]);
    const source = createReminderScheduleProjectionSource({
      reminderTemplateRepository: {
        findByIdForIdentity: vi.fn(),
        findAllTemplateRefs,
      },
    });
    await expect(source.listTemplateRefs()).resolves.toEqual([
      { templateId: 'ReminderTemplateId_a', identityId: 'IdentityId_1' },
      { templateId: 'ReminderTemplateId_b', identityId: 'IdentityId_2' },
    ]);
  });

  it('re-arms recurring reminders only after the persisted reminder:triggered event', async () => {
    const upsertTemplate = vi.fn().mockResolvedValue(undefined);
    const deleteTemplate = vi.fn().mockResolvedValue(undefined);
    const handlers = createReminderScheduleProjectionEventHandlers({
      upsertTemplate,
      deleteTemplate,
    });

    await handlers['reminder:triggered']({
      identityId: 'IdentityId_reminder-owner' as never,
      templateId: 'ReminderTemplateId_template-1' as never,
      groupId: null,
      triggeredAt: 1,
      nextTriggerAt: 2,
      reminder: {} as never,
    });

    expect(upsertTemplate).toHaveBeenCalledWith(
      'ReminderTemplateId_template-1',
      'IdentityId_reminder-owner',
    );
    expect(deleteTemplate).not.toHaveBeenCalled();
  });
});
