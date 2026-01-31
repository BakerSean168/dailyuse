/**
 * 通知渠道
 */
export const NotificationChannel = {
  InApp: 'InApp', // 应用内通知
  Push: 'Push', // 推送通知
  Email: 'Email', // 邮件通知
  Sms: 'Sms', // 短信通知
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
