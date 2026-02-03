/**
 * AI Quota Exceeded Event
 * 
 * Triggered when: User exceeds AI quota limit
 * Subscribers: Rate limiting service, User notifications
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface AIQuotaExceededEvent {
  /** Limit value */
  limit: number;
}
