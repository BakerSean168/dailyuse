import type { NotificationServerDTO } from '../../aggregates';

/**
 * Notification Read Event
 *
 * Triggered when a notification is marked as read.
 */
export interface NotificationReadEvent {
  identityId: string;
  notificationId: string;
  notification: NotificationServerDTO;
  readAt: number;
}
