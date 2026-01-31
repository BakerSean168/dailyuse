/**
 * 复盘类型
 */
export const ReviewType = {
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  Annual: 'Annual',
  Adhoc: 'Adhoc', // 临时复盘
  Final: 'Final', // 终结复盘
} as const;

export type ReviewType = (typeof ReviewType)[keyof typeof ReviewType];
