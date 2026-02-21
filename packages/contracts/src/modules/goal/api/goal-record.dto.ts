/**
 * Goal - Record Operations
 * 
 * 目标记录管理（进度记录）
 */

import { z } from 'zod';
import type { GoalRecordClientDTO } from '../aggregates';

// ============================================================================
// CREATE Goal Record
// ============================================================================

/**
 * 创建目标记录 Schema
 */
export const CreateGoalRecordSchema = z.object({
  keyResultId: z.string().uuid('关键结果 UUID 无效'),
  value: z.number().min(0, '记录值不能为负数'),
  note: z.string().max(500).optional(),
});

export type CreateGoalRecordReq = z.infer<typeof CreateGoalRecordSchema>;
export type CreateGoalRecordRes = GoalRecordClientDTO;

// ============================================================================
// GET Goal Records
// ============================================================================

/**
 * 查询目标记录
 */
export const GetGoalRecordsSchema = z.object({
  goalId: z.string().uuid('目标 UUID 无效').optional(),
  keyResultId: z.string().uuid('关键结果 UUID 无效').optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

export type GetGoalRecordsReq = z.infer<typeof GetGoalRecordsSchema>;

export interface GetGoalRecordsRes {
  data: GoalRecordClientDTO[];
  total: number;
}

// ============================================================================
// DELETE Goal Record
// ============================================================================

export type DeleteGoalRecordReq = void;
export type DeleteGoalRecordRes = GoalRecordClientDTO;
