/**
 * AI Quota Created Event
 * 
 * Triggered when: AI quota is initialized
 * Subscribers: Quota tracking service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface AIQuotaCreatedEvent {
  /** Quota type (goal-generation, task-generation, etc) */
  type: string;

  /** Initial limit */
  limit: number;
}
