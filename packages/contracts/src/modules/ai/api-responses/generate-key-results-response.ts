/**
 * Generate Key Results Response
 * 生成关键结果响应DTO
 */

import type { KeyResultValueType } from '../../goal/value-objects/key-result-value-type';
import type { KeyResultCalculationMethod } from '../../goal/value-objects/key-result-calculation-method';
import type { TokenUsageClientDTO } from '../value-objects/token-usage';

/**
 * 关键结果预览DTO
 * 用于AI生成的候选关键结果
 */
export interface KeyResultPreview {
  /** 关键结果标题 (5-100字符) */
  title: string;
  /** 关键结果描述（可选） */
  description?: string;
  /** 值类型 */
  valueType: KeyResultValueType;
  /** 目标值 (> 0) */
  targetValue: number;
  /** 当前值（可选，默认0） */
  currentValue?: number;
  /** 单位（可选，如 'users', 'hours', '%'） */
  unit?: string;
  /** 权重 (0-100) */
  weight: number;
  /** 聚合计算方式 */
  aggregationMethod: KeyResultCalculationMethod;
}

/**
 * 生成关键结果响应
 */
export interface GenerateKeyResultsResponse {
  /** 生成的关键结果预览列表 (3-5个) */
  keyResults: KeyResultPreview[];
  /** Token使用统计 */
  tokenUsage: TokenUsageClientDTO;
  /** 生成时间戳 */
  generatedAt: number;
}
