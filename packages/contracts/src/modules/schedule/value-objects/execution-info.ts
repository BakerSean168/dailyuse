/**
 * Execution Info Value Object
 */

import type { ExecutionStatus } from './execution-status';

export const ExecutionHealthStatus = {
  Healthy: 'healthy',
  Warning: 'warning',
  Critical: 'critical',
} as const;

export type ExecutionHealthStatus =
  (typeof ExecutionHealthStatus)[keyof typeof ExecutionHealthStatus];

// ============ Interface Definitions ============

/** Execution info - Server interface. */
export interface IExecutionInfoServer {
  /** Next execution time */
  nextRunAt: number | null;

  /** Last execution time */
  lastRunAt: number | null;

  /** Total execution count */
  executionCount: number;

  /** Last execution status */
  lastExecutionStatus: ExecutionStatus | null;

  /** Last execution duration (ms) */
  lastExecutionDuration: number | null;

  /** Consecutive failure count */
  consecutiveFailures: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IExecutionInfoServer,
        | 'equals'
        | 'with'
        | 'updateAfterExecution'
        | 'resetFailures'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IExecutionInfoServer;
  updateAfterExecution(params: {
    executedAt: number;
    status: ExecutionStatus;
    duration: number;
    nextRunAt: number | null;
  }): IExecutionInfoServer;

  // DTO conversion methods
}

/** Execution info - Client interface. */
export interface IExecutionInfoClient {
  /** Next execution time */
  nextRunAt: Date | null;

  /** Last execution time */
  lastRunAt: Date | null;

  /** Total execution count */
  executionCount: number;

  /** Last execution status */
  lastExecutionStatus: ExecutionStatus | null;

  /** Consecutive failure count */
  consecutiveFailures: number;

  // UI helper properties
  /** Formatted next run time */
  nextRunAtFormatted: string | null; // "2025-01-01 09:00" | "In 30 minutes"

  /** Formatted last run time */
  lastRunAtFormatted: string | null; // "2 hours ago"

  /** Formatted last execution duration */
  lastExecutionDurationFormatted: string | null; // "1.2s"

  /** Formatted execution count */
  executionCountFormatted: string; // "Executed 100 times"

  /** Health status */
  healthStatus: ExecutionHealthStatus; // Based on consecutive failure count

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Execution Info Server DTO
 */
export interface ExecutionInfoServerDTO {
  nextRunAt: string | null; // ISO string
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  lastExecutionDuration: number | null;
  consecutiveFailures: number;
}

/**
 * Execution Info Client DTO
 */
export interface ExecutionInfoClientDTO {
  nextRunAt: string | null;
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  consecutiveFailures: number;
  nextRunAtFormatted: string | null;
  lastRunAtFormatted: string | null;
  lastExecutionDurationFormatted: string | null;
  executionCountFormatted: string;
  healthStatus: ExecutionHealthStatus;
}

/**
 * Execution Info Persistence DTO
 */
export interface ExecutionInfoPersistenceDTO {
  nextRunAt: string | null;
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: string | null;
  last_execution_duration: number | null;
  consecutive_failures: number;
}

// ============ Type Exports ============

export type ExecutionInfoServer = IExecutionInfoServer;
export type ExecutionInfoClient = IExecutionInfoClient;
