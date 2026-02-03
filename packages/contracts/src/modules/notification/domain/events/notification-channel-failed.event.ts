/**
 * Notification Channel Failed Event
 * 
 * Triggered when: Delivery via channel fails
 * Subscribers: Retry service, Fallback handlers
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface NotificationChannelFailedEvent {
  /** Failed channel (email, push, sms, etc) */
  channel: string;

  /** Failure reason */
  reason: string;
}
