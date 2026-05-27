/**
 * AI Module Custom Errors
 * AI 模块自定义错误类
 */

import { DomainError } from '@dailyuse/utils/errors';

/**
 * AI 生成超时错误
 */
export class AIGenerationTimeoutError extends DomainError {
  constructor(timeoutSeconds: number) {
    super(
      'TIMEOUT',
      `AI generation timed out after ${timeoutSeconds} seconds`,
      { timeoutSeconds },
      504,
    );
  }
}

/**
 * AI 配额超限错误
 */
export class AIQuotaExceededError extends DomainError {
  public readonly quotaLimit: number;
  public readonly currentUsage: number;
  public readonly resetAt: Date;

  constructor(quotaLimit: number, currentUsage: number, resetAt: Date) {
    super(
      'RATE_LIMITED',
      `AI quota exceeded. Limit: ${quotaLimit}, Current usage: ${currentUsage}. ` +
        `Quota resets at ${resetAt.toISOString()}`,
      { quotaLimit, currentUsage, resetAt: resetAt.toISOString() },
      429,
    );
    this.quotaLimit = quotaLimit;
    this.currentUsage = currentUsage;
    this.resetAt = resetAt;
  }
}

/**
 * AI 提供商错误
 */
export class AIProviderError extends DomainError {
  public readonly provider: string;

  constructor(provider: string, message: string, originalError?: Error) {
    super('SERVICE_UNAVAILABLE', `AI Provider (${provider}) error: ${message}`, { provider }, 503, {
      originalError,
    });
    this.provider = provider;
  }
}

/**
 * AI 验证错误
 */
export class AIValidationError extends DomainError {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[]) {
    super('VALIDATION_ERROR', `AI validation failed: ${message}`, { validationErrors }, 422);
    this.validationErrors = validationErrors;
  }
}
