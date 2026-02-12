/**
 * AI Module Custom Errors
 * AI 模块自定义错误类
 */

/**
 * AI 生成超时错误
 */
export class AIGenerationTimeoutError extends Error {
  constructor(timeoutSeconds: number) {
    super(`AI generation timed out after ${timeoutSeconds} seconds`);
    this.name = 'AIGenerationTimeoutError';
  }
}

/**
 * AI 配额超限错误
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
 * AI 提供商错误
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
 * AI 验证错误
 */
export class AIValidationError extends Error {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[]) {
    super(`AI validation failed: ${message}`);
    this.name = 'AIValidationError';
    this.validationErrors = validationErrors;
  }
}
