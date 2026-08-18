/** AI-owned structured failures used by domain/application AI flows. */

import { AIExecutionError } from '../../../shared/ai-execution-error';

export class AIGenerationTimeoutError extends AIExecutionError {
  readonly timeoutSeconds: number;
  constructor(timeoutSeconds: number) {
    super('timeout', `AI generation timed out after ${timeoutSeconds} seconds`);
    this.timeoutSeconds = timeoutSeconds;
  }
}

export class AIQuotaExceededError extends AIExecutionError {
  constructor(
    readonly quotaLimit: number,
    readonly currentUsage: number,
    readonly resetAt: Date,
  ) {
    super('rate_limited', 'AI quota exceeded');
  }
}

export class AIProviderError extends AIExecutionError {
  constructor(
    readonly provider: string,
    message: string,
    originalError?: Error,
  ) {
    super('upstream_provider_error', `AI provider ${provider} failed`, { cause: originalError });
  }
}

export class AIValidationError extends AIExecutionError {
  constructor(
    message: string,
    readonly validationErrors: string[],
  ) {
    super('validation', `AI validation failed: ${message}`);
  }
}
