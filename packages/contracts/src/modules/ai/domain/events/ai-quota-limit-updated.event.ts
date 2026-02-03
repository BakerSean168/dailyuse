/**
 * AI Quota Limit Updated Event
 * 
 * Triggered when: AI quota limit is changed
 * Subscribers: Quota management service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface AIQuotaLimitUpdatedEvent {
  /** Previous limit */
  previousLimit: number;

  /** New limit */
  newLimit: number;
}
