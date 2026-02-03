/**
 * Notification Sent Event
 * 
 * Triggered when: Notification is sent via channel
 * Subscribers: Delivery tracking, Delivery history
 */
export interface NotificationSentEvent {
  /** Notification unique identifier */
  notificationId: string;

  /** Channel used (email, push, sms, etc) */
  channel: string;

  /** Send timestamp */
  sentAt: number;
}
