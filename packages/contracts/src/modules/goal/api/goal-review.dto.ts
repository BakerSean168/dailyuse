/**
 * Goal - Review Operations
 * 
 * 目标复盘管理
 */

import { z } from 'zod';
import type { GoalReviewServerDTO } from '../entities';
import { ReviewType } from '../value-objects/review-type';

// ============================================================================
// CREATE Review
// ============================================================================

/**
 * 创建复盘 Schema
 */
export const CreateGoalReviewSchema = z.object({
  goalId: z.string().uuid('目标 UUID 无效'),
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
export type CreateGoalReviewRes = GoalReviewServerDTO;

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
export type UpdateGoalReviewRes = GoalReviewServerDTO;

// ============================================================================
// GET Review
// ============================================================================

/**
 * 获取复盘详情
 */
export type GetGoalReviewReq = void;
export type GetGoalReviewRes = GoalReviewServerDTO;

/**
 * 删除复盘
 */
export type DeleteGoalReviewReq = void;
export type DeleteGoalReviewRes = GoalReviewServerDTO;

// ============================================================================
// QUERY Reviews
// ============================================================================

/**
 * 查询复盘列表
 */
export const GetGoalReviewsSchema = z.object({
  goalId: z.string().uuid('目标 UUID 无效'),
});

export type GetGoalReviewsReq = z.infer<typeof GetGoalReviewsSchema>;

export interface GetGoalReviewsRes {
  data: GoalReviewServerDTO[];
  total: number;
}
