import type { NotificationServerDTO } from '../../aggregates/notification-server';
import type { NotificationStatus } from '../../value-objects/notification-status';

/**
 * Notification Status Changed Event
 *
 * Triggered when the notification aggregate changes status.
 */
export interface NotificationStatusChangedEvent {
  identityId: string;
  notificationId: string;
  notification: NotificationServerDTO;
  previousStatus: NotificationStatus;
  newStatus: NotificationStatus;
}
