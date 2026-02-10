/**
 * AI Module Custom Errors (API Layer)
 * Duplicated from domain-server to resolve package export constraints.
 */

/**
 * AI 鐢熸垚瓒呮椂閿欒
 */
export class AIGenerationTimeoutError extends Error {
  constructor(timeoutSeconds: number) {
    super(`AI generation timed out after ${timeoutSeconds} seconds`);
    this.name = 'AIGenerationTimeoutError';
  }
}

/**
 * AI 閰嶉瓒呴檺閿欒
 */
export class AIQuotaExceededError extends Error {
  public readonly quotaLimit: number;
  public readonly currentUsage: number;
  public readonly resetAt: Date;

  constructor(quotaLimit: number, currentUsage: number, resetAt: Date) {
    super(
      `AI quota exceeded. Limit: ${quotaLimit}, Current usage: ${currentUsage}. ` +
        `Quota resets at ${resetAt.toISOString()}`,
    );
    this.name = 'AIQuotaExceededError';
    this.quotaLimit = quotaLimit;
    this.currentUsage = currentUsage;
    this.resetAt = resetAt;
  }
}

/**
 * AI 鎻愪緵鍟嗛敊璇?
 */
export class AIProviderError extends Error {
  public readonly provider: string;
  public readonly originalError?: Error;

  constructor(provider: string, message: string, originalError?: Error) {
    super(`AI Provider (${provider}) error: ${message}`);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.originalError = originalError;
  }
}

/**
 * AI 楠岃瘉閿欒
 */
export class AIValidationError extends Error {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[]) {
    super(`AI validation failed: ${message}`);
    this.name = 'AIValidationError';
    this.validationErrors = validationErrors;
  }
}
