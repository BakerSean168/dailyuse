import type { NotificationServerDTO } from '../../aggregates/notification-server';
import type { IdentityId, NotificationId } from '../../../../primitives';

/**
 * Notification Channel Failed Event
 *
 * Triggered when delivery for a notification channel fails.
 */
export interface NotificationChannelFailedEvent {
  identityId: IdentityId;
  notificationId: NotificationId;
  notification: NotificationServerDTO;
  channel: string;
  reason: string;
}
