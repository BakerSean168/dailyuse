/**
 * AI Quota Consumed Event
 * 
 * Triggered when: AI quota is used
 * Subscribers: Quota tracking, Usage analytics
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface AIQuotaConsumedEvent {
  /** Amount consumed */
  amount: number;

  /** Remaining quota */
  remaining: number;
}
