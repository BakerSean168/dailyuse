/**
 * Priority Calculation Error
 * 优先级计算错误类
 */

import { ResultErrorException } from '@memoflow/contracts/result';

export class PriorityCalculationError extends ResultErrorException {
  constructor(message: string) {
    super(message, 'BUSINESS_ERROR', undefined, undefined, 400);
  }
}
