import type { NotificationServerDTO } from '../../aggregates/notification-server';

/**
 * Notification Channel Failed Event
 *
 * Triggered when delivery for a notification channel fails.
 */
export interface NotificationChannelFailedEvent {
  identityId: string;
  notificationId: string;
  notification: NotificationServerDTO;
  channel: string;
  reason: string;
}
