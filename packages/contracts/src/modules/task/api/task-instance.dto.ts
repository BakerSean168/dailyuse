/**
 * Task Instance Query Operations
 *
 * This file contains DTOs for querying task instances.
 * Task instances represent actual occurrences of task templates in a time range.
 */

import { z } from 'zod';
import type { TaskInstanceClientDTO } from '../aggregates/task-instance-client';
import { CheckExpiredTaskInstancesResponseSchema } from './response-schemas';

// ============================================================================
// GET Task Operations
// ============================================================================

/**
 * 获取任务实例列表 Schema
 */
export const GetTaskInstancesByRangeSchema = z.object({
  startDate: z.coerce.number().int(),
  endDate: z.coerce.number().int(),
});

export type GetTaskInstancesByRangeReq = z.infer<typeof GetTaskInstancesByRangeSchema>;
export interface GetTaskInstancesByRangeRes {
  data: TaskInstanceClientDTO[];
  total: number;
}

// Residual 697: list response dual body retired — OpenAPI + transport use CheckExpiredTaskInstancesResponseSchema.
export type CheckExpiredTaskInstancesRes = z.infer<typeof CheckExpiredTaskInstancesResponseSchema>;

export const CompleteTaskInstanceSchema = z.object({
  duration: z.number().optional(),
  note: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
}).default({});

export type CompleteTaskInstanceReq = z.infer<typeof CompleteTaskInstanceSchema>;

export const SkipTaskInstanceSchema = z.object({
  reason: z.string().optional(),
}).default({});

export type SkipTaskInstanceReq = z.infer<typeof SkipTaskInstanceSchema>;

export interface TaskInstanceOperationRes {
  instance: TaskInstanceClientDTO;
}

