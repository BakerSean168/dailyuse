/**
 * Goal - Review Operations
 *
 * 目标复盘管理
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId } from '../../../primitives';
import type { GoalReviewServerDTO } from '../entities/goal-review-server';
import { ReviewType } from '../value-objects/review-type';

// ============================================================================
// CREATE Review
// ============================================================================

/**
 * 创建复盘 Schema
 */
export const CreateGoalReviewSchema = z.object({
  goalId: brandedId<GoalId>(),
  title: z.string().min(1, '复盘标题不能为空').max(256),
  content: z.string().min(1, '复盘内容不能为空').max(10000),
  reviewType: z.enum(ReviewType),
  rating: z.number().int().min(1).max(5).optional(),
  achievements: z.string().max(2000).optional(),
  challenges: z.string().max(2000).optional(),
  nextActions: z.string().max(2000).optional(),
  reviewedAt: z.number().int().optional(),
});

export type CreateGoalReviewReq = z.infer<typeof CreateGoalReviewSchema>;

// ============================================================================
// UPDATE Review
// ============================================================================

/**
 * 更新复盘 Schema
 */
export const UpdateGoalReviewSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  content: z.string().min(1).max(10000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  achievements: z.string().max(2000).nullable().optional(),
  challenges: z.string().max(2000).nullable().optional(),
  nextActions: z.string().max(2000).nullable().optional(),
});

export type UpdateGoalReviewReq = z.infer<typeof UpdateGoalReviewSchema>;

// ============================================================================
// GET Review
// ============================================================================

/**
 * 获取复盘详情
 */
export type GetGoalReviewReq = void;

/**
 * 删除复盘
 */
export type DeleteGoalReviewReq = void;

// ============================================================================
// QUERY Reviews
// ============================================================================

/**
 * 查询复盘列表
 */
export const GetGoalReviewsSchema = z.object({
  goalId: brandedId<GoalId>(),
});

export type GetGoalReviewsReq = z.infer<typeof GetGoalReviewsSchema>;

export interface GetGoalReviewsRes {
  data: GoalReviewServerDTO[];
  total: number;
}
