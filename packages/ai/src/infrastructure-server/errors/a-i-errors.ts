/**
 * AI Module Custom Errors (API Layer)
 * Re-exports from domain-server for backward compatibility.
 */

export {
  AIGenerationTimeoutError,
  AIQuotaExceededError,
  AIProviderError,
  AIValidationError,
} from '../../domain-server/errors/ai-errors';
