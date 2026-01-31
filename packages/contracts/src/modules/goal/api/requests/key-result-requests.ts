/**
 * KeyResult Requests
 */

import type { KeyResultValueType } from '../../value-objects/key-result-value-type';
import type { KeyResultCalculationMethod } from '../../value-objects/key-result-calculation-method';

/**
 * 添加关键结果请求
 */
export interface AddKeyResultRequest {
  goalUuid: string;
  title: string;
  description?: string;
  valueType: KeyResultValueType;
  calculationMethod: KeyResultCalculationMethod;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  weight: number;
}

/**
 * 更新关键结果请求
 */
export interface UpdateKeyResultRequest {
  title?: string;
  description?: string;
  startValue?: number;
  targetValue?: number;
  unit?: string;
  weight?: number;
}

/**
 * 更新关键结果进度请求
 */
export interface UpdateKeyResultProgressRequest {
  keyResultUuid: string;
  newValue: number;
  note?: string;
}
