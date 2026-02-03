/**
 * AI Quota Reset Event
 * 
 * Triggered when: AI quota is reset (monthly, yearly, etc)
 * Subscribers: Quota management service
 */
export interface AIQuotaResetEvent {
  /** Quota unique identifier */
  quotaId: string;

  /** Reset timestamp */
  resetAt: number;
}
