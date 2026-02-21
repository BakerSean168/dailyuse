/**
 * ScheduleTask API Requests
 * 调度任务 API 请求定义
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { ScheduleTaskId } from '@/primitives';
import type { ScheduleTaskClientDTO } from '../../aggregates/schedule-task-client';
import type { ScheduleConfigServerDTO, RetryPolicyServerDTO, TaskMetadataServerDTO } from '../../value-objects';
import { SourceModule } from '../../value-objects/source-module';
import { ScheduleTaskStatus } from '../../value-objects/schedule-task-status';
import { TaskPriority } from '../../value-objects/task-priority';
import { Timezone } from '../../value-objects/timezone';

// ============ Zod Schemas ============

const ScheduleConfigSchema = z.object({
  cronExpression: z.string().min(1),
  timezone: z.nativeEnum(Timezone),
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
  payload: z.record(z.string(), z.any().openapi({ type: 'object' })).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  timeout: z.number().min(1000).nullable().optional(),
});

export const CreateScheduleTaskRequestSchema = z.object({
  name: z.string().min(1).max(200),
  sourceModule: z.nativeEnum(SourceModule),
  sourceEntityId: z.string().uuid(),
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
  timezone: z.nativeEnum(Timezone).optional(),
  startDate: z.number().nullable().optional(),
  endDate: z.number().nullable().optional(),
  maxExecutions: z.number().min(1).nullable().optional(),
});

export const UpdateTaskMetadataRequestSchema = z.object({
  payload: z.record(z.string(), z.any().openapi({ type: 'object' })).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  timeout: z.number().min(1000).nullable().optional(),
});

export const ScheduleTaskQueryParamsSchema = z.object({
  sourceModule: z.nativeEnum(SourceModule).optional(),
  sourceEntityId: z.string().uuid().optional(),
  status: z.nativeEnum(ScheduleTaskStatus).optional(),
  enabled: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'nextRunAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const BatchScheduleTaskOperationRequestSchema = z.object({
  taskIds: z.array(brandedId<ScheduleTaskId>()).min(1),
  operation: z.enum(['pause', 'resume', 'cancel', 'enable', 'disable']),
  reason: z.string().max(500).optional(),
});

// ============ Request Types ============

/**
 * 创建调度任务请求
 */
export interface CreateScheduleTaskRequest {
  readonly name: string;
  readonly sourceModule: SourceModule;
  readonly sourceEntityId: string;
  readonly schedule: ScheduleConfigServerDTO;
  readonly description?: string;
  readonly metadata?: Partial<TaskMetadataServerDTO>;
  readonly retryPolicy?: Partial<RetryPolicyServerDTO>;
  readonly enabled?: boolean;
}

/**
 * 更新调度任务请求
 */
export interface UpdateScheduleTaskRequest {
  readonly name?: string;
  readonly description?: string;
  readonly schedule?: Partial<ScheduleConfigServerDTO>;
  readonly metadata?: Partial<TaskMetadataServerDTO>;
  readonly retryPolicy?: Partial<RetryPolicyServerDTO>;
  readonly enabled?: boolean;
}

/**
 * 更新任务调度配置请求
 */
export interface UpdateScheduleConfigRequest {
  readonly cronExpression?: string;
  readonly timezone?: Timezone;
  readonly startDate?: number | null;
  readonly endDate?: number | null;
  readonly maxExecutions?: number | null;
}

/**
 * 更新任务元数据请求
 */
export interface UpdateTaskMetadataRequest {
  readonly payload?: Record<string, any>;
  readonly tags?: string[];
  readonly priority?: TaskPriority;
  readonly timeout?: number | null;
}

/**
 * 任务查询参数
 */
export interface ScheduleTaskQueryParamsDTO {
  readonly sourceModule?: SourceModule;
  readonly sourceEntityId?: string;
  readonly status?: ScheduleTaskStatus;
  readonly enabled?: boolean;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'nextRunAt' | 'name';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * 批量操作请求
 */
export interface BatchScheduleTaskOperationRequest {
  readonly taskIds: readonly ScheduleTaskId[];
  readonly operation: 'pause' | 'resume' | 'cancel' | 'enable' | 'disable';
  readonly reason?: string;
}

// ============ Response Types ============

/**
 * 任务详情响应（单个）
 */
export type ScheduleTaskDTO = ScheduleTaskClientDTO;

/**
 * 任务列表响应
 */
export interface ScheduleTaskListResponseDTO {
  readonly items: readonly ScheduleTaskClientDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponseDTO {
  readonly success: readonly string[];
  readonly failed: readonly {
    taskId: ScheduleTaskId;
    error: string;
  }[];
  readonly total: number;
  readonly successCount: number;
  readonly failedCount: number;
}
