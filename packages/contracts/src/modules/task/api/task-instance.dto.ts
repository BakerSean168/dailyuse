/**
 * Task Instance Query Operations
 *
 * This file contains DTOs for querying task instances.
 * Task instances represent actual occurrences of task templates in a time range.
 */

import { z } from 'zod';
import {
  CheckExpiredTaskInstancesResponseSchema,
  TaskInstanceResponseSchema,
} from './response-schemas';

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

// Residual 789: by-range list Res dual retired — sole ResSchema + z.infer
// (nests TaskInstanceResponseSchema; matches TaskInstanceClientDTO fields).
export const GetTaskInstancesByRangeResSchema = z.object({
  data: z.array(TaskInstanceResponseSchema),
  total: z.number(),
});
export type GetTaskInstancesByRangeRes = z.infer<typeof GetTaskInstancesByRangeResSchema>;

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

// Residual 789: complete/skip operation Res dual retired — sole ResSchema + z.infer.
export const TaskInstanceOperationResSchema = z.object({
  instance: TaskInstanceResponseSchema,
});
export type TaskInstanceOperationRes = z.infer<typeof TaskInstanceOperationResSchema>;

