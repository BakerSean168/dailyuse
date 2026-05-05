/**
 * Retry Policy Value Object
 */

// ============ Interface Definitions ============

/** Retry policy interface. */
export interface IRetryPolicy {
  /** Whether retry is enabled */
  enabled: boolean;

  /** Maximum retry count */
  maxRetries: number;

  /** Initial retry delay (ms) */
  retryDelay: number;

  /** Backoff multiplier (for exponential backoff) */
  backoffMultiplier: number;

  /** Maximum retry delay (ms) */
  maxRetryDelay: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IRetryPolicy,
        | 'equals'
        | 'with'
        | 'shouldRetry'
        | 'calculateNextRetryDelay'
        | 'toDTO'
      >
    >,
  ): IRetryPolicy;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Retry Policy DTO
 */
export interface RetryPolicyDTO {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}
