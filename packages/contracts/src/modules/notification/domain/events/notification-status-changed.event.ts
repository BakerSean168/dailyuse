import type { NotificationServerDTO } from '../../aggregates/notification-server';
import type { NotificationStatus } from '../../value-objects/notification-status';
import type { IdentityId, NotificationId } from '../../../../primitives';

/**
 * Notification Status Changed Event
 *
 * Triggered when the notification aggregate changes status.
 */
export interface NotificationStatusChangedEvent {
  identityId: IdentityId;
  notificationId: NotificationId;
  notification: NotificationServerDTO;
  previousStatus: NotificationStatus;
  newStatus: NotificationStatus;
}
