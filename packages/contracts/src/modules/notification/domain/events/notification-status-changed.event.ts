/**
 * Notification Status Changed Event
 * 
 * Triggered when: Notification status changes (pending, delivered, failed, etc)
 * Subscribers: Status tracking, Retry service
 */
export interface NotificationStatusChangedEvent {
  /** Notification unique identifier */
  notificationId: string;

  /** Previous status */
  previousStatus: string;

  /** New status */
  newStatus: string;

  /** Change timestamp */
  changedAt: number;
}
