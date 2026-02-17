/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import { ReminderPolicy } from '../../domain-server/services/ReminderPolicy';
import { ReminderTemplate } from '../../domain-server/aggregates/reminder-template';
import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import {
  ReminderType,
  TriggerType,
  RecurrenceType,
  WeekDay,
  NotificationChannel,
  NotificationAction,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
import { IdentityId } from '@dailyuse/domain-shared';

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplate {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
  ) {
  }

  async execute(identityId: string, input: CreateReminderTemplateReq): Promise<ReminderTemplateClientDTO> {
    const policy = new ReminderPolicy();
    const group = input.groupId
      ? await this.groupRepository.findById(input.groupId)
      : null;

    if (input.groupId && !group) {
      throw new Error(`Invalid groupId: ${input.groupId}`);
    }

    const mappedImportance: 'Vital' | 'Important' | 'Moderate' | 'Minor' | 'Trivial' | undefined =
      input.importanceLevel === 'CRITICAL'
        ? 'Vital'
        : input.importanceLevel === 'HIGH'
          ? 'Important'
          : input.importanceLevel === 'MEDIUM'
            ? 'Moderate'
            : input.importanceLevel === 'LOW'
              ? 'Minor'
              : undefined;

    const normalizedInput = {
      ...input,
      type: input.type === 'ONE_TIME' ? ReminderType.OneTime : ReminderType.Recurring,
      trigger: {
        ...input.trigger,
        type: input.trigger.type === 'FIXED_TIME' ? TriggerType.FixedTime : TriggerType.Interval,
      },
      activeTime: {
        activatedAt: input.activeTime.startDate,
      },
      activeHours: input.activeHours
        ? {
            enabled: true,
            startHour: input.activeHours.startHour,
            endHour: input.activeHours.endHour,
          }
        : undefined,
      recurrence: input.recurrence
        ? {
            ...input.recurrence,
            type:
              input.recurrence.type === 'DAILY'
                ? RecurrenceType.Daily
                : input.recurrence.type === 'WEEKLY'
                  ? RecurrenceType.Weekly
                  : RecurrenceType.CustomDays,
            weekly: input.recurrence.weekly
              ? {
                  ...input.recurrence.weekly,
                  weekDays: input.recurrence.weekly.weekDays.map((day) => {
                    if (day === 'MON') return WeekDay.Monday;
                    if (day === 'TUE') return WeekDay.Tuesday;
                    if (day === 'WED') return WeekDay.Wednesday;
                    if (day === 'THU') return WeekDay.Thursday;
                    if (day === 'FRI') return WeekDay.Friday;
                    if (day === 'SAT') return WeekDay.Saturday;
                    return WeekDay.Sunday;
                  }),
                }
              : null,
          }
        : undefined,
      notificationConfig: {
        ...input.notificationConfig,
        channels: input.notificationConfig.channels.map((channel) => {
          if (channel === 'IN_APP') return NotificationChannel.InApp;
          if (channel === 'PUSH') return NotificationChannel.Push;
          if (channel === 'EMAIL') return NotificationChannel.Email;
          return NotificationChannel.Sms;
        }),
        actions: input.notificationConfig.actions
          ? input.notificationConfig.actions.map((action) => ({
              ...action,
              action:
                action.action === 'DISMISS'
                  ? NotificationAction.Dismiss
                  : action.action === 'SNOOZE'
                    ? NotificationAction.Snooze
                    : action.action === 'COMPLETE'
                      ? NotificationAction.Complete
                      : NotificationAction.Custom,
            }))
          : null,
      },
      importanceLevel: mappedImportance,
    };

    const template = ReminderTemplate.create({
      ...normalizedInput,
      identityId: IdentityId.of(identityId),
    });

    policy.assertValidGroupAssignment(template, group);
    template.setEffectiveEnabled(policy.calculateEffectiveEnabled(template, group));
    await this.templateRepository.save(template);

    // 发布领域事件
    const events = template.pullDomainEvents();
    for (const event of events) {
      const payload = event.payload as Record<string, unknown>;
      eventBus.send(event.eventType as any, {
        ...payload,
        reminderData: template.toServerDTO(),
      } as any);
    }

    return template.toClientDTO();
  }
}
