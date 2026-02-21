/**
 * Task Instance Query Operations
 * 
 * This file contains DTOs for querying task instances.
 * Task instances represent actual occurrences of task templates in a time range.
 */

import { z } from 'zod';
import type { TaskInstanceClientDTO } from '../aggregates';

// ============================================================================
// GET Task Operations
// ============================================================================

/**
 * 获取任务实例列表 Schema
 */
export const GetTaskInstancesByRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeArchived: z.boolean().default(false).optional(),
});

export type GetTaskInstancesByRangeReq = z.infer<typeof GetTaskInstancesByRangeSchema>;
export interface GetTaskInstancesByRangeRes {
  data: TaskInstanceClientDTO[];
  total: number;
}

export const CompleteTaskInstanceSchema = z.object({
  duration: z.number().optional(),
  note: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export type CompleteTaskInstanceReq = z.infer<typeof CompleteTaskInstanceSchema>;

export const SkipTaskInstanceSchema = z.object({
  reason: z.string().optional(),
});

export type SkipTaskInstanceReq = z.infer<typeof SkipTaskInstanceSchema>;

export interface TaskInstanceOperationRes {
  instance: TaskInstanceClientDTO;
}

export type CompleteTaskInstanceRes = TaskInstanceOperationRes;
export type SkipTaskInstanceRes = TaskInstanceOperationRes;
