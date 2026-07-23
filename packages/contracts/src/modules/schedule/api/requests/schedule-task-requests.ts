/**
 * ScheduleTask API Requests
 * 调度任务 API 请求定义
 */

import { z } from 'zod';
import { brandedId } from '../../../../primitives';
import type { ScheduleTaskId } from '../../../../primitives';
import { SourceModule } from '../../value-objects/source-module';
import { ScheduleTaskStatus } from '../../value-objects/schedule-task-status';
import { TaskPriority } from '../../value-objects/task-priority';
import { Timezone } from '../../value-objects/timezone';

export const ScheduleTaskSortBy = {
  CreatedAt: 'createdAt',
  UpdatedAt: 'updatedAt',
  NextRunAt: 'nextRunAt',
  Name: 'name',
} as const;

export type ScheduleTaskSortBy = (typeof ScheduleTaskSortBy)[keyof typeof ScheduleTaskSortBy];

export const BatchScheduleTaskOperation = {
  Pause: 'pause',
  Resume: 'resume',
  Cancel: 'cancel',
  Enable: 'enable',
  Disable: 'disable',
} as const;

export type BatchScheduleTaskOperation =
  (typeof BatchScheduleTaskOperation)[keyof typeof BatchScheduleTaskOperation];

// ============ Zod Schemas ============

const ScheduleConfigSchema = z.object({
  cronExpression: z.string().min(1),
  timezone: z.enum(Timezone),
  startDate: z.number().nullable().optional(),
  endDate: z.number().nullable().optional(),
  maxExecutions: z.number().min(1).nullable().optional(),
});

const RetryPolicySchema = z.object({
  maxRetries: z.number().min(0).max(10).optional(),
  retryDelay: z.number().min(1000).optional(),
  backoffMultiplier: z.number().min(1).optional(),
  maxRetryDelay: z.number().optional(),
});

const TaskMetadataSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(TaskPriority).optional(),
  timeout: z.number().min(1000).nullable().optional(),
});

export const CreateScheduleTaskRequestSchema = z.object({
  name: z.string().min(1).max(200),
  sourceModule: z.enum(SourceModule),
  sourceEntityId: brandedId<string>(),
  schedule: ScheduleConfigSchema,
  description: z.string().max(2000).optional(),
  metadata: TaskMetadataSchema.partial().optional(),
  retryPolicy: RetryPolicySchema.partial().optional(),
  enabled: z.boolean().optional(),
});

export const UpdateScheduleTaskRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  schedule: ScheduleConfigSchema.partial().optional(),
  metadata: TaskMetadataSchema.partial().optional(),
  retryPolicy: RetryPolicySchema.partial().optional(),
  enabled: z.boolean().optional(),
});

export const UpdateScheduleConfigRequestSchema = z.object({
  cronExpression: z.string().min(1).optional(),
  timezone: z.enum(Timezone).optional(),
  startDate: z.number().nullable().optional(),
  endDate: z.number().nullable().optional(),
  maxExecutions: z.number().min(1).nullable().optional(),
});

export const UpdateTaskMetadataRequestSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(TaskPriority).optional(),
  timeout: z.number().min(1000).nullable().optional(),
});

export const ScheduleTaskQueryParamsSchema = z.object({
  sourceModule: z.enum(SourceModule).optional(),
  sourceEntityId: brandedId<string>().optional(),
  status: z.enum(ScheduleTaskStatus).optional(),
  enabled: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.enum(ScheduleTaskSortBy).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const BatchScheduleTaskOperationRequestSchema = z.object({
  taskIds: z.array(brandedId<ScheduleTaskId>()).min(1),
  operation: z.enum(BatchScheduleTaskOperation),
  reason: z.string().max(500).optional(),
});

// ============ Request Types ============

// Residual 709: schedule-task request dual bodies retired — OpenAPI + transport use *RequestSchema only.
/** 创建调度任务请求 */
export type CreateScheduleTaskRequest = z.infer<typeof CreateScheduleTaskRequestSchema>;
/** 更新调度任务请求 */
export type UpdateScheduleTaskRequest = z.infer<typeof UpdateScheduleTaskRequestSchema>;
/** 更新任务调度配置请求 */
export type UpdateScheduleConfigRequest = z.infer<typeof UpdateScheduleConfigRequestSchema>;
/** 更新任务元数据请求 */
export type UpdateTaskMetadataRequest = z.infer<typeof UpdateTaskMetadataRequestSchema>;

// Residual 703: query params dual body retired — OpenAPI + transport use ScheduleTaskQueryParamsSchema.
export type ScheduleTaskQueryParamsDTO = z.infer<typeof ScheduleTaskQueryParamsSchema>;

// Residual 709: batch operation request dual body retired.
/** 批量操作请求 */
export type BatchScheduleTaskOperationRequest = z.infer<
  typeof BatchScheduleTaskOperationRequestSchema
>;

// ============ Response Types ============
// Residual 663: dead task-list response dual retired (query bodies use ClientDTO item arrays).

/**
 * 批量操作响应
 */
/** Residual 639: schedule-scoped batch result (not shared BatchOperationResponseDTO dual). */
export interface ScheduleBatchOperationResponseDTO {
  readonly success: readonly string[];
  readonly failed: readonly {
    taskId: ScheduleTaskId;
    error: string;
  }[];
  readonly total: number;
  readonly successCount: number;
  readonly failedCount: number;
}
