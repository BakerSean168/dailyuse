/**
 * AI Quota Created Event
 * 
 * Triggered when: AI quota is initialized
 * Subscribers: Quota tracking service
 */
export interface AIQuotaCreatedEvent {
  /** Quota unique identifier */
  quotaId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Quota type (goal-generation, task-generation, etc) */
  type: string;

  /** Initial limit */
  limit: number;

  /** Creation timestamp */
  createdAt: number;
}
