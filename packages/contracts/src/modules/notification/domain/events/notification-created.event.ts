/**
 * Notification Created Event
 * 
 * Triggered when: New notification is created
 * Subscribers: Notification service, Delivery pipeline
 */
export interface NotificationCreatedEvent {
  /** Notification unique identifier */
  notificationId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Creation timestamp */
  createdAt: number;
}
