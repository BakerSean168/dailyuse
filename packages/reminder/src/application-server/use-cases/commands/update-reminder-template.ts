/**
 * Update Reminder Template Service
 *
 * 更新提醒模板
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '@/domain-server/repositories/IReminderGroupRepository';
import type {
  ReminderTemplateClientDTO,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import {
  RecurrenceType,
  WeekDay,
  NotificationChannel,
  NotificationAction,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
import { ReminderPolicy } from '@/domain-server/services/ReminderPolicy';

/**
 * Update Reminder Template Service
 */
export class UpdateReminderTemplate {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository?: IReminderGroupRepository,
  ) {}

  async execute(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new Error(`Reminder Template ${id} not found`);
    }

    const policy = new ReminderPolicy();
    const group =
      request.groupId !== undefined && request.groupId !== null && this.groupRepository
        ? await this.groupRepository.findById(request.groupId)
        : null;

    if (request.groupId !== undefined && request.groupId !== null && !group) {
      throw new Error(`Invalid groupId: ${request.groupId}`);
    }

    if (request.groupId !== undefined) {
      policy.assertValidGroupAssignment(template, group);
    }

    const normalizedRecurrence = request.recurrence
      ? {
          ...request.recurrence,
          type:
            request.recurrence.type === 'DAILY'
              ? RecurrenceType.Daily
              : request.recurrence.type === 'WEEKLY'
                ? RecurrenceType.Weekly
                : RecurrenceType.CustomDays,
          weekly: request.recurrence.weekly
            ? {
                ...request.recurrence.weekly,
                weekDays: request.recurrence.weekly.weekDays.map((day) => {
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
      : undefined;

    const normalizedNotificationConfig = request.notificationConfig
      ? {
          ...request.notificationConfig,
          channels: request.notificationConfig.channels.map((channel) => {
            if (channel === 'IN_APP') return NotificationChannel.InApp;
            if (channel === 'PUSH') return NotificationChannel.Push;
            if (channel === 'EMAIL') return NotificationChannel.Email;
            return NotificationChannel.Sms;
          }),
          actions: request.notificationConfig.actions
            ? request.notificationConfig.actions.map((action) => ({
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
        }
      : undefined;

    // Use domain entity's update method
    template.update({
      title: request.title,
      description: request.description,
      activeTime: request.activeTime
        ? { activatedAt: request.activeTime.startDate }
        : undefined,
      notificationConfig: normalizedNotificationConfig,
      recurrence: normalizedRecurrence,
      activeHours: request.activeHours
        ? {
            enabled: true,
            startHour: request.activeHours.startHour,
            endHour: request.activeHours.endHour,
          }
        : undefined,
      importanceLevel:
        request.importanceLevel === 'CRITICAL'
          ? 'Vital'
          : request.importanceLevel === 'HIGH'
            ? 'Important'
            : request.importanceLevel === 'MEDIUM'
              ? 'Moderate'
              : request.importanceLevel === 'LOW'
                ? 'Minor'
                : undefined,
      tags: request.tags,
      color: request.color,
      icon: request.icon,
      groupId: request.groupId,
    });

    if (request.groupId !== undefined) {
      template.setEffectiveEnabled(policy.calculateEffectiveEnabled(template, group));
    }

    // Save to repository
    await this.templateRepository.save(template);

    // Publish domain events
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
