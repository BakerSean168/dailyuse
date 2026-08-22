import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { KeyResultId } from '../../../primitives';
import { KeyResultValueType } from '../value-objects/key-result-value-type';
import { KeyResultCalculationMethod } from '../value-objects/key-result-calculation-method';

/** Key-result fields shared by aggregate creation and standalone addition. */
export const KeyResultInputSchema = z.object({
  id: brandedId<KeyResultId>().optional(),
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
