/**
 * Notification Sent Event
 * 
 * Triggered when: Notification is sent via channel
 * Subscribers: Delivery tracking, Delivery history
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface NotificationSentEvent {
  /** Channel used (email, push, sms, etc) */
  channel: string;
}
