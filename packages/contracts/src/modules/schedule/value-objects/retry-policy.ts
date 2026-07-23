/**
 * Retry Policy Value Object
 */

import { z } from 'zod';

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

// Residual 749: RetryPolicyDTO dual body retired — OpenAPI response transport uses
// RetryPolicySchema (semantic type is a z.infer alias). Request schemas stay local
// (partial/optional field set).

export const RetryPolicySchema = z.object({
  enabled: z.boolean(),
  maxRetries: z.number(),
  retryDelay: z.number(),
  backoffMultiplier: z.number(),
  maxRetryDelay: z.number(),
});

export type RetryPolicyDTO = z.infer<typeof RetryPolicySchema>;
