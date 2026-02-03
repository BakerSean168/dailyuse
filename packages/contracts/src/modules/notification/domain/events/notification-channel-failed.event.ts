/**
 * Notification Channel Failed Event
 * 
 * Triggered when: Delivery via channel fails
 * Subscribers: Retry service, Fallback handlers
 */
export interface NotificationChannelFailedEvent {
  /** Notification unique identifier */
  notificationId: string;

  /** Failed channel (email, push, sms, etc) */
  channel: string;

  /** Failure reason */
  reason: string;

  /** Failure timestamp */
  failedAt: number;
}
