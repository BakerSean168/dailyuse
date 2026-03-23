import type { NotificationServerDTO } from '../../aggregates';

/**
 * Notification Deleted Event
 *
 * Triggered when a notification is soft-deleted.
 */
export interface NotificationDeletedEvent {
  identityId: string;
  notificationId: string;
  notification: NotificationServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
