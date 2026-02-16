/**
 * Goal - Key Result Operations
 * 
 * 关键结果(OKR)的管理操作
 */

import { z } from 'zod';
import type { KeyResultServerDTO } from '../entities';

// ============================================================================
// ADD Key Result
// ============================================================================

/**
 * 添加关键结果 Schema
 */
export const AddKeyResultSchema = z.object({
  goalId: z.string().uuid('目标 UUID 无效'),
  title: z.string().min(1, '关键结果标题不能为空').max(256),
  description: z.string().max(2000).optional(),
  valueType: z.string().min(1, '关键结果类型不能为空'),
  calculationMethod: z.string().min(1, '计算方法不能为空'),
  targetValue: z.number().min(0, '目标值不能为负数'),
  currentValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  weight: z.number().min(0).max(1, '权重必须在 0-1 之间'),
});

export type AddKeyResultReq = z.infer<typeof AddKeyResultSchema>;
export type AddKeyResultRes = KeyResultServerDTO;

// ============================================================================
// UPDATE Key Result
// ============================================================================

/**
 * 更新关键结果 Schema
 */
export const UpdateKeyResultSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  startValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(50).nullable().optional(),
  weight: z.number().min(0).max(1).optional(),
});

export type UpdateKeyResultReq = z.infer<typeof UpdateKeyResultSchema>;
export type UpdateKeyResultRes = KeyResultServerDTO;

// ============================================================================
// GET Key Results
// ============================================================================

/**
 * 获取关键结果列表
 */
export const GetKeyResultsSchema = z.object({
  goalId: z.string().uuid('目标 UUID 无效'),
});

export type GetKeyResultsReq = z.infer<typeof GetKeyResultsSchema>;

export interface GetKeyResultsRes {
  data: KeyResultServerDTO[];
  total: number;
}

// ============================================================================
// UPDATE Progress
// ============================================================================

/**
 * 更新关键结果进度 Schema
 */
export const UpdateKeyResultProgressSchema = z.object({
  keyResultId: z.string().uuid('关键结果 UUID 无效'),
  newValue: z.number().min(0, '新值不能为负数'),
  note: z.string().max(500).optional(),
});

export type UpdateKeyResultProgressReq = z.infer<typeof UpdateKeyResultProgressSchema>;
export type UpdateKeyResultProgressRes = KeyResultServerDTO;
