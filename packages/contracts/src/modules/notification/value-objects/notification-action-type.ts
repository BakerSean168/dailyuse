/**
 * 通知操作类型枚举
 */
export const NotificationActionType = {
  Navigate: 'Navigate',
  ApiCall: 'ApiCall',
  Dismiss: 'Dismiss',
  Custom: 'Custom',
} as const;

export type NotificationActionType = (typeof NotificationActionType)[keyof typeof NotificationActionType];
