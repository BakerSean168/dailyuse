/**
 * ScheduleExecution API Requests
 * 调度执行记录 API 请求定义
 */

import { z } from 'zod';
import { brandedId } from '../../../../primitives';
import type { ScheduleTaskId } from '../../../../primitives';
import { ExecutionStatus } from '../../value-objects/execution-status';

// ============ Zod Schemas ============

export const ScheduleExecutionQueryParamsSchema = z.object({
  taskId: brandedId<ScheduleTaskId>().optional(),
  status: z.enum(ExecutionStatus).optional(),
  startTime: z.number().positive().optional(),
  endTime: z.number().positive().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.enum(['executionTime', 'duration']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============ Request Types ============

/**
 * 执行记录查询参数
 */
export interface ScheduleExecutionQueryParamsDTO {
  readonly taskId?: ScheduleTaskId;
  readonly status?: ExecutionStatus;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'executionTime' | 'duration';
  readonly sortOrder?: 'asc' | 'desc';
}

// Residual 663: dead execution list/stats response duals retired
// (RPC query uses ClientDTO item arrays; get-stats remains module-local).
