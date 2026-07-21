import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import type { IReminderTemplateRepository } from '../domain/repositories/i-reminder-template-repository';
import type { ReminderScheduleExecutionSource } from '../../schedule-execution';

export interface CreateReminderScheduleExecutionSourceDeps {
  readonly reminderTemplateRepository: Pick<
    IReminderTemplateRepository,
    'findById' | 'findByIdForIdentity' | 'save'
  >;
}

function mapReminderChannels(channels: unknown): NotificationChannelType[] {
  if (!Array.isArray(channels)) {
    return [NotificationChannelType.InApp];
  }

  return channels.map((channel) => {
    if (typeof channel !== 'string') {
      return NotificationChannelType.InApp;
    }

    const mapped = NotificationChannelType[channel as keyof typeof NotificationChannelType];
    return mapped ?? NotificationChannelType.InApp;
  });
}

export function createReminderScheduleExecutionSource(
  deps: CreateReminderScheduleExecutionSourceDeps,
): ReminderScheduleExecutionSource {
  return {
    async executeReminder(task) {
      const reminder = await deps.reminderTemplateRepository.findByIdForIdentity(
        String(task.identityId),
        task.sourceEntityId,
        {
          includeHistory: true,
        },
      );

      if (!reminder || !reminder.isEffectivelyEnabled() || reminder.deletedAt) {
        return { nextRunAt: null, result: { skipped: true } };
      }

      reminder.recordTrigger();
      await deps.reminderTemplateRepository.save(reminder);

      return {
        nextRunAt: reminder.nextTriggerAt,
        notification: {
          identityId: String(reminder.identityId),
          title: reminder.notificationConfig.title ?? reminder.title,
          content: reminder.notificationConfig.body ?? reminder.description ?? '',
          type: NotificationType.Reminder,
          category: NotificationCategory.Reminder,
          relatedEntityType: RelatedEntityType.Reminder,
          relatedEntityId: reminder.id,
          channels: mapReminderChannels(reminder.notificationConfig.channels),
        },
        result: {
          reminderId: reminder.id,
          reminderTitle: reminder.title,
        },
      };
    },
  };
}
