/**
 * Retry Policy Value Object
 */

// ============ Interface Definitions ============

/** Retry policy - Server interface. */
export interface IRetryPolicyServer {
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
        IRetryPolicyServer,
        | 'equals'
        | 'with'
        | 'shouldRetry'
        | 'calculateNextRetryDelay'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IRetryPolicyServer;

  // DTO conversion methods
}

/** Retry policy - Client interface. */
export interface IRetryPolicyClient {
  /** Whether retry is enabled */
  enabled: boolean;

  /** Maximum retry count */
  maxRetries: number;

  /** Initial retry delay */
  retryDelay: number;

  /** Backoff multiplier */
  backoffMultiplier: number;

  /** Maximum retry delay */
  maxRetryDelay: number;

  // UI helper properties
  /** Retry policy description */
  policyDescription: string; // "Retry up to 3 times, delay 5s ~ 60s"

  /** Enabled status display */
  enabledDisplay: string; // "Enabled" | "Disabled"

  /** Formatted retry delay */
  retryDelayFormatted: string; // "5s"

  /** Formatted max retry delay */
  maxRetryDelayFormatted: string; // "60s"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Retry Policy Server DTO
 */
export interface RetryPolicyServerDTO {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

/**
 * Retry Policy Client DTO
 */
export interface RetryPolicyClientDTO {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  policyDescription: string;
  enabledDisplay: string;
  retryDelayFormatted: string;
  maxRetryDelayFormatted: string;
}

/**
 * Retry Policy Persistence DTO
 */
export interface RetryPolicyPersistenceDTO {
  enabled: boolean;
  maxRetries: number;
  retry_delay: number;
  backoff_multiplier: number;
  max_retry_delay: number;
}

// ============ Type Exports ============

export type RetryPolicyServer = IRetryPolicyServer;
export type RetryPolicyClient = IRetryPolicyClient;
