/**
 * Key Result Progress Value Object Contracts
 * 关键成果进度值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import { z } from 'zod';
import { KeyResultValueType } from './key-result-value-type';
import { KeyResultCalculationMethod } from './key-result-calculation-method';

// ============ Domain Shape (领域层) ============

/**
 * 关键成果进度 - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
export interface KeyResultProgress {
  valueType: KeyResultValueType;
  aggregationMethod: KeyResultCalculationMethod;
  /**
   * 起始值（可选，默认为 0）
   * 用于计算进度百分比：(currentValue - initialValue) / (targetValue - initialValue)
   */
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string | null;
}

// Residual 737: KeyResultProgressDTO dual body retired — OpenAPI + transport use
// KeyResultProgressDTOSchema (semantic type is a z.infer alias).

export const KeyResultProgressDTOSchema = z.object({
  valueType: z.enum(KeyResultValueType),
  aggregationMethod: z.enum(KeyResultCalculationMethod),
  initialValue: z.number(),
  targetValue: z.number(),
  currentValue: z.number(),
  unit: z.string().nullable(),
});

export type KeyResultProgressDTO = z.infer<typeof KeyResultProgressDTOSchema>;
