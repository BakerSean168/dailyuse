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

/** Execution info interface. */
export interface IExecutionInfo {
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
        IExecutionInfo,
        | 'equals'
        | 'with'
        | 'updateAfterExecution'
        | 'resetFailures'
        | 'toDTO'
      >
    >,
  ): IExecutionInfo;
  updateAfterExecution(params: {
    executedAt: number;
    status: ExecutionStatus;
    duration: number;
    nextRunAt: number | null;
  }): IExecutionInfo;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Execution Info DTO
 */
export interface ExecutionInfoDTO {
  nextRunAt: string | null; // ISO string
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  lastExecutionDuration: number | null;
  consecutiveFailures: number;
}
