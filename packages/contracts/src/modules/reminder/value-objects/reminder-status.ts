/**
 * 提醒状态
 */
export const ReminderStatus = {
  Active: 'Active', // 活跃
  Paused: 'Paused', // 已暂停
} as const;

export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus];
