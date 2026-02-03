/**
 * Notification Status Changed Event
 * 
 * Triggered when: Notification status changes (pending, delivered, failed, etc)
 * Subscribers: Status tracking, Retry service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface NotificationStatusChangedEvent {
  /** Previous status */
  previousStatus: string;

  /** New status */
  newStatus: string;
}
