/**
 * 关键结果值类型
 */
export const KeyResultValueType = {
  Incremental: 'Incremental', // 累积值
  Absolute: 'Absolute', // 绝对值
  Percentage: 'Percentage', // 百分比
  Binary: 'Binary', // 二元（完成/未完成）
} as const;

export type KeyResultValueType = (typeof KeyResultValueType)[keyof typeof KeyResultValueType];
