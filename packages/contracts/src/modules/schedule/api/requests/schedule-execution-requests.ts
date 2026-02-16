/**
 * ScheduleExecution API Requests
 * 调度执行记录 API 请求定义
 */

import { z } from 'zod';
import type { ScheduleExecutionClientDTO } from '../../entities/schedule-execution-client';
import type { ExecutionStatus } from '../../value-objects/execution-status';

// ============ Zod Schemas ============

export const ScheduleExecutionQueryParamsSchema = z.object({
  taskId: z.string().uuid().optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'SKIPPED', 'TIMEOUT', 'RETRYING']).optional(),
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
  readonly taskId?: string;
  readonly status?: ExecutionStatus;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'executionTime' | 'duration';
  readonly sortOrder?: 'asc' | 'desc';
}

// ============ Response Types ============

/**
 * 执行记录详情响应（单个）
 */
export type ScheduleExecutionDTO = ScheduleExecutionClientDTO;

/**
 * 执行记录列表响应
 */
export interface ScheduleExecutionListResponseDTO {
  readonly items: readonly ScheduleExecutionClientDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * 执行历史统计响应
 */
export interface ExecutionHistoryStatsDTO {
  readonly taskId: string;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly avgDuration: number;
  readonly recentExecutions: readonly ScheduleExecutionClientDTO[];
}
