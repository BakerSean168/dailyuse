/**
 * Notification Read Event
 * 
 * Triggered when: User reads notification
 * Subscribers: Read status tracking, Analytics
 */
export interface NotificationReadEvent {
  /** Notification unique identifier */
  notificationId: string;

  /** Read timestamp */
  readAt: number;
}
