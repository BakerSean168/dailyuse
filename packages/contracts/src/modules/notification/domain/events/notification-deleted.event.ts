/**
 * Notification Deleted Event
 * 
 * Triggered when: Notification is deleted
 * Subscribers: Cleanup service
 */
export interface NotificationDeletedEvent {
  /** Notification unique identifier */
  notificationId: string;

  /** Deletion timestamp */
  deletedAt: number;
}
