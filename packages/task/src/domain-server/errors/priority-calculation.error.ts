/**
 * Priority Calculation Error
 * 优先级计算错误类
 */

import { DomainError } from '@dailyuse/utils';

export class PriorityCalculationError extends DomainError {
  constructor(message: string) {
    super('BUSINESS_ERROR', message, undefined, 400);
  }
}
