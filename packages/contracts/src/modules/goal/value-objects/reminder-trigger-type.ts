/**
 * 提醒触发类型（Goal 模块专用）
 */
export const ReminderTriggerType = {
  TimeProgressPercentage: 'TimeProgressPercentage', // 时间进度百分比
  RemainingDays: 'RemainingDays', // 剩余天数
} as const;

export type ReminderTriggerType = (typeof ReminderTriggerType)[keyof typeof ReminderTriggerType];
