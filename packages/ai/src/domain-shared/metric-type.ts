import type { MetricType as IMetricType } from '@dailyuse/contracts/ai';

/**
 * MetricType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type MetricType = IMetricType & { readonly __brand: unique symbol };

const VALUES: IMetricType[] = ['Number', 'Percentage', 'Time', 'Boolean'];

export const MetricType = {
  Number: 'Number' as MetricType,
  Percentage: 'Percentage' as MetricType,
  Time: 'Time' as MetricType,
  Boolean: 'Boolean' as MetricType,

  of(value: string): MetricType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid MetricType: ${value}`);
    }
    return value as MetricType;
  },

  isValid(value: string): value is MetricType {
    return VALUES.includes(value as IMetricType);
  },

  getAll(): MetricType[] {
    return VALUES as MetricType[];
  },
};
