/**
 * 重复类型
 */
export const RecurrenceType = {
  Daily: 'Daily', // 每日
  Weekly: 'Weekly', // 每周
  CustomDays: 'CustomDays', // 自定义日期
} as const;

export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];
