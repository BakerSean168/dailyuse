import type { NotificationServerDTO } from '../../aggregates';

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
