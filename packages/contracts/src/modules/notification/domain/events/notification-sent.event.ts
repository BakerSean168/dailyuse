import type { NotificationServerDTO } from '../../aggregates/notification-server';
import type { IdentityId, NotificationId } from '../../../../primitives';

/**
 * Notification Sent Event
 *
 * Triggered when a notification transitions to the sent state.
 */
export interface NotificationSentEvent {
  identityId: IdentityId;
  notificationId: NotificationId;
  notification: NotificationServerDTO;
  channelTypes: string[];
  sentAt: number;
}
