import type { NotificationServerDTO } from '../../aggregates/notification-server';

/**
 * Notification Created Event
 *
 * Triggered when a new notification aggregate is created.
 */
export interface NotificationCreatedEvent {
  identityId: string;
  notificationId: string;
  notification: NotificationServerDTO;
}
