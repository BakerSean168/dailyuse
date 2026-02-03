/**
 * AI Quota Consumed Event
 * 
 * Triggered when: AI quota is used
 * Subscribers: Quota tracking, Usage analytics
 */
export interface AIQuotaConsumedEvent {
  /** Quota unique identifier */
  quotaId: string;

  /** Amount consumed */
  amount: number;

  /** Remaining quota */
  remaining: number;

  /** Consumption timestamp */
  consumedAt: number;
}
