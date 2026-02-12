import type { AITaskPriority as IAITaskPriority } from '@dailyuse/contracts/ai';

/**
 * AITaskPriority 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type AITaskPriority = IAITaskPriority & { readonly __brand: unique symbol };

const VALUES: IAITaskPriority[] = ['High', 'Medium', 'Low'];

export const AITaskPriority = {
  High: 'High' as AITaskPriority,
  Medium: 'Medium' as AITaskPriority,
  Low: 'Low' as AITaskPriority,

  of(value: string): AITaskPriority {
    if (!this.isValid(value)) {
      throw new Error(`Invalid AITaskPriority: ${value}`);
    }
    return value as AITaskPriority;
  },

  isValid(value: string): value is AITaskPriority {
    return VALUES.includes(value as IAITaskPriority);
  },

  getAll(): AITaskPriority[] {
    return VALUES as AITaskPriority[];
  },

  isHigh(priority: AITaskPriority): boolean {
    return priority === this.High;
  },

  isMedium(priority: AITaskPriority): boolean {
    return priority === this.Medium;
  },

  isLow(priority: AITaskPriority): boolean {
    return priority === this.Low;
  },
};
