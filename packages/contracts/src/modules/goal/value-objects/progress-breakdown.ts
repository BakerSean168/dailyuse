/**
 * 目标进度分解详情
 *
 * 提供目标进度的详细计算信息，包括每个关键结果的贡献度
 *
 * Residual 805: ProgressBreakdown dual retired — sole ProgressBreakdownResSchema + z.infer.
 */

import type { z } from 'zod';
import { ProgressBreakdownResSchema } from '../api/response-schemas';

export const ProgressCalculationMode = {
  WeightedAverage: 'WeightedAverage',
} as const;

export type ProgressCalculationMode =
  (typeof ProgressCalculationMode)[keyof typeof ProgressCalculationMode];

// Residual 805: ProgressBreakdown dual retired — OpenAPI + transport use ProgressBreakdownResSchema.
export type ProgressBreakdown = z.infer<typeof ProgressBreakdownResSchema>;

/**
 * 进度分解响应（嵌套包装；API 成功体直接用 flat ProgressBreakdownResSchema）
 */
export interface ProgressBreakdownResponse {
  breakdown: ProgressBreakdown;
}
