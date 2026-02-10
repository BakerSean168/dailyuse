/**
 * Priority Calculation Error
 * 优先级计算错误类
 */

export class PriorityCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PriorityCalculationError';
    Object.setPrototypeOf(this, PriorityCalculationError.prototype);
  }
}
