/**
 * 专注周期状态
 */
export const FocusSessionStatus = {
  Active: 'Active', // 进行中
  Completed: 'Completed', // 已完成
  Cancelled: 'Cancelled', // 已取消
} as const;

export type FocusSessionStatus = (typeof FocusSessionStatus)[keyof typeof FocusSessionStatus];
