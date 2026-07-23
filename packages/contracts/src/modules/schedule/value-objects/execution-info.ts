/**
 * Execution Info Value Object
 */

import { z } from 'zod';
import type { ExecutionStatus } from './execution-status';
import { ExecutionStatus as ExecutionStatusEnum } from './execution-status';

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

// Residual 749: ExecutionInfoDTO dual body retired — OpenAPI response transport uses
// ExecutionInfoSchema (semantic type is a z.infer alias). Domain IExecutionInfo keeps
// numeric timestamps (shape intentionally differs from transfer DTO ISO strings).

export const ExecutionInfoSchema = z.object({
  nextRunAt: z.string().nullable(),
  lastRunAt: z.string().nullable(),
  executionCount: z.number(),
  lastExecutionStatus: z.enum(ExecutionStatusEnum).nullable(),
  lastExecutionDuration: z.number().nullable(),
  consecutiveFailures: z.number(),
});

export type ExecutionInfoDTO = z.infer<typeof ExecutionInfoSchema>;
