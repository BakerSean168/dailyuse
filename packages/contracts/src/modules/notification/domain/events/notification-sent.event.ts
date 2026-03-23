import type { NotificationServerDTO } from '../../aggregates';

/**
 * Notification Sent Event
 *
 * Triggered when a notification transitions to the sent state.
 */
export interface NotificationSentEvent {
  identityId: string;
  notificationId: string;
  notification: NotificationServerDTO;
  channelTypes: string[];
  sentAt: number;
}
