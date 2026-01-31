/**
 * 提醒类型
 */
export const ReminderType = {
  OneTime: 'OneTime', // 一次性提醒
  Recurring: 'Recurring', // 循环提醒
} as const;

export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];
