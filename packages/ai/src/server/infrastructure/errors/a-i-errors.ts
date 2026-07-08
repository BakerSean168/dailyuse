/**
 * AI Module Custom Errors (API Layer)
 * Re-exports from domain for backward compatibility.
 */

export {
  AIGenerationTimeoutError,
  AIQuotaExceededError,
  AIProviderError,
  AIValidationError,
} from '../../domain/errors/ai-errors';
