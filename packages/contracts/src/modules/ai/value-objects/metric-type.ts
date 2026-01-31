/**
 * 指标类型
 */
export const MetricType = {
  Number: 'Number',
  Percentage: 'Percentage',
  Time: 'Time',
  Boolean: 'Boolean',
} as const;

export type MetricType = (typeof MetricType)[keyof typeof MetricType];
