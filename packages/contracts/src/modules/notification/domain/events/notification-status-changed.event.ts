import type { NotificationServerDTO } from '../../aggregates';
import type { NotificationStatus } from '../../value-objects';

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
