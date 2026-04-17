/**
 * Goal - Record Operations
 *
 * 目标记录管理（进度记录）
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId, KeyResultId } from '../../../primitives';
import type { GoalRecordClientDTO } from '../aggregates/goal-record-client';

// ============================================================================
// CREATE Goal Record
// ============================================================================

/**
 * 创建目标记录 Schema
 */
export const CreateGoalRecordSchema = z.object({
  keyResultId: brandedId<KeyResultId>(),
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
  goalId: brandedId<GoalId>().optional(),
  keyResultId: brandedId<KeyResultId>().optional(),
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
