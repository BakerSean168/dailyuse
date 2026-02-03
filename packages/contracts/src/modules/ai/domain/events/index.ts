/**
 * AI Module - Domain Events
 * 
 * All domain event types for the AI module
 */

export type { AIQuotaCreatedEvent } from './ai-quota-created.event';
export type { AIQuotaConsumedEvent } from './ai-quota-consumed.event';
export type { AIQuotaExceededEvent } from './ai-quota-exceeded.event';
export type { AIQuotaResetEvent } from './ai-quota-reset.event';
export type { AIQuotaLimitUpdatedEvent } from './ai-quota-limit-updated.event';

// Re-export union type
export type { AIQuotaCreatedEvent as AIDomainEvent } from './ai-quota-created.event';
