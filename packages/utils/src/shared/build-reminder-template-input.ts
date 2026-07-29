import type { GoalAutomationReminderPreview } from '@memoflow/contracts/ai';
import type { CreateReminderTemplateReq } from '@memoflow/contracts/reminder';
import {
  NotificationChannel,
  ReminderType,
  TriggerType,
} from '@memoflow/contracts/reminder';
import {
  buildReminderStartTimestamp,
  normalizeReminderTimeOfDay,
} from './reminder-time-of-day';

/**
 * Residual 1013: sole buildReminderTemplateInput for API/Desktop goal automation.
 * Maps GoalAutomationReminderPreview → CreateReminderTemplateReq.
 * Soft residual 835: activeTime uses activatedAt (not startDate/endDate dual).
 * Soft residual 1007: reuses normalizeReminderTimeOfDay + buildReminderStartTimestamp.
 */

export const DAILY_REVIEW_INTERVAL_MINUTES = 24 * 60;
export const WEEKLY_REVIEW_INTERVAL_MINUTES = 7 * DAILY_REVIEW_INTERVAL_MINUTES;

export function buildReminderTemplateInput(
  reminder: GoalAutomationReminderPreview,
  now = Date.now(),
): CreateReminderTemplateReq {
  const isOneTime = reminder.cadence === 'once';
  const timeOfDay = normalizeReminderTimeOfDay(reminder.timeOfDay);
  const startTime = buildReminderStartTimestamp(timeOfDay, now);
  return {
    title: reminder.title,
    description: reminder.description,
    type: isOneTime ? ReminderType.OneTime : ReminderType.Recurring,
    trigger: isOneTime
      ? {
          type: TriggerType.FixedTime,
          fixedTime: {
            time: timeOfDay,
            timezone: null,
          },
          interval: null,
        }
      : {
          type: TriggerType.Interval,
          fixedTime: null,
          interval: {
            minutes:
              reminder.cadence === 'daily'
                ? DAILY_REVIEW_INTERVAL_MINUTES
                : WEEKLY_REVIEW_INTERVAL_MINUTES,
            startTime,
          },
        },
    activeTime: {
      activatedAt: startTime,
    },
    notificationConfig: {
      channels: [NotificationChannel.InApp],
      title: reminder.title,
      body: reminder.description ?? null,
      sound: null,
      vibration: null,
      actions: null,
    },
    importanceLevel: reminder.importance,
    tags: ['goal-agent'],
  };
}
