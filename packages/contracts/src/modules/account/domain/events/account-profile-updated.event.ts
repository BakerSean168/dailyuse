/**
 * Account Profile Updated Event
 * 
 * Triggered when: User profile information is updated
 * Subscribers: Profile cache, User service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface AccountProfileUpdatedEvent {
  /** List of fields that were changed */
  changes: string[];
}
