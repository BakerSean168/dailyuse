import type {
  AIQuotaCreatedEvent,
  AIQuotaConsumedEvent,
  AIQuotaExceededEvent,
  AIQuotaResetEvent,
  AIQuotaLimitUpdatedEvent,
} from '../domain/events';

/**
 * AI Module - Event Map
 *
 * Event Naming Convention: ai:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type AIEventMap = {
  /**
   * AI quota created event
   * Triggered when user AI quota is created
   */
  'ai:quota-created': AIQuotaCreatedEvent;

  /**
   * AI quota consumed event
   * Triggered when user consumes AI tokens
   */
  'ai:quota-consumed': AIQuotaConsumedEvent;

  /**
   * AI quota reset event
   * Triggered when user quota resets
   */
  'ai:quota-reset': AIQuotaResetEvent;

  /**
   * AI quota exceeded event
   * Triggered when user quota is exceeded
   */
  'ai:quota-exceeded': AIQuotaExceededEvent;

  /**
   * AI quota limit updated event
   * Triggered when quota limit is updated
   */
  'ai:quota-limit-updated': AIQuotaLimitUpdatedEvent;
};
