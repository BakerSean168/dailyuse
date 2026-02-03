/**
 * AI Quota Exceeded Event
 * 
 * Triggered when: User exceeds AI quota limit
 * Subscribers: Rate limiting service, User notifications
 */
export interface AIQuotaExceededEvent {
  /** Quota unique identifier */
  quotaId: string;

  /** Limit value */
  limit: number;

  /** Exceeded timestamp */
  exceededAt: number;
}
