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
export const GetInstancesByRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeArchived: z.boolean().optional().default(false),
});

export type GetInstancesByRangeReq = z.infer<typeof GetInstancesByRangeSchema>;

export interface GetInstancesByRangeRes {
  data: TaskInstanceClientDTO[];
  total: number;
}
