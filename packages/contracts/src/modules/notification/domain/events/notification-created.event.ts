/**
 * Notification Created Event
 * 
 * Triggered when: New notification is created
 * Subscribers: Notification service, Delivery pipeline
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface NotificationCreatedEvent {
  /** User/Identity identifier */
  identityId: string;
}
