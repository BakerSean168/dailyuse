/**
 * Goal - Key Result Operations
 *
 * 关键结果(OKR)的管理操作
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId, KeyResultId } from '../../../primitives';
import type { KeyResultClientDTO } from '../entities';
import { KeyResultValueType } from '../value-objects/key-result-value-type';
import { KeyResultCalculationMethod } from '../value-objects/key-result-calculation-method';

// ============================================================================
// ADD Key Result
// ============================================================================

/**
 * 添加关键结果 Schema
 */
export const AddKeyResultSchema = z.object({
  goalId: brandedId<GoalId>(),
  title: z.string().min(1, '关键结果标题不能为空').max(256),
  description: z.string().max(2000).optional(),
  valueType: z.enum(KeyResultValueType),
  calculationMethod: z.enum(KeyResultCalculationMethod),
  startValue: z.number().optional(),
  targetValue: z.number().min(0, '目标值不能为负数'),
  currentValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  weight: z.number().int('权重必须为整数').min(1, '权重最小为 1').max(5, '权重最大为 5'),
});

export type AddKeyResultReq = z.infer<typeof AddKeyResultSchema>;
export type AddKeyResultRes = KeyResultClientDTO;

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
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(50).nullable().optional(),
  weight: z.number().int('权重必须为整数').min(1, '权重最小为 1').max(5, '权重最大为 5').optional(),
});

export type UpdateKeyResultReq = z.infer<typeof UpdateKeyResultSchema>;
export type UpdateKeyResultRes = KeyResultClientDTO;

// ============================================================================
// GET Key Results
// ============================================================================

/**
 * 获取关键结果列表
 */
export const GetKeyResultsSchema = z.object({
  goalId: brandedId<GoalId>(),
});

export type GetKeyResultsReq = z.infer<typeof GetKeyResultsSchema>;

export interface GetKeyResultsRes {
  data: KeyResultClientDTO[];
  total: number;
}

// ============================================================================
// UPDATE Progress
// ============================================================================

/**
 * 更新关键结果进度 Schema
 */
export const UpdateKeyResultProgressSchema = z.object({
  keyResultId: brandedId<KeyResultId>(),
  newValue: z.number().min(0, '新值不能为负数'),
  note: z.string().max(500).optional(),
});

export type UpdateKeyResultProgressReq = z.infer<typeof UpdateKeyResultProgressSchema>;
export type UpdateKeyResultProgressRes = KeyResultClientDTO;
