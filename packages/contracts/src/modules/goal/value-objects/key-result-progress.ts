/**
 * Key Result Progress Value Object Contracts
 * 关键成果进度值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type { KeyResultValueType } from './key-result-value-type';
import type { KeyResultCalculationMethod } from './key-result-calculation-method';

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

// ============ Transfer DTO (传输层) ============

/**
 * Key Result Progress DTO
 * API 传输用
 */
export interface KeyResultProgressDTO {
  valueType: KeyResultValueType;
  aggregationMethod: KeyResultCalculationMethod;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string | null;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Key Result Progress Persistence DTO
 * 数据库存储用
 */
export interface KeyResultProgressPersistenceDTO {
  valueType: string;
  aggregationMethod: string;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string | null;
}
