/**
 * 通知操作类型
 */
export const NotificationAction = {
  Dismiss: 'Dismiss', // 关闭
  Snooze: 'Snooze', // 稍后提醒
  Complete: 'Complete', // 完成
  Custom: 'Custom', // 自定义操作
} as const;

export type NotificationAction = (typeof NotificationAction)[keyof typeof NotificationAction];
