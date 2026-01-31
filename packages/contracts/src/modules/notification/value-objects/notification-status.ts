/**
 * 通知状态枚举
 */
export const NotificationStatus = {
  Pending: 'Pending',
  Sent: 'Sent',
  Delivered: 'Delivered',
  Read: 'Read',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
