/**
 * AI Quota Limit Updated Event
 * 
 * Triggered when: AI quota limit is changed
 * Subscribers: Quota management service
 */
export interface AIQuotaLimitUpdatedEvent {
  /** Quota unique identifier */
  quotaId: string;

  /** Previous limit */
  previousLimit: number;

  /** New limit */
  newLimit: number;

  /** Update timestamp */
  updatedAt: number;
}
