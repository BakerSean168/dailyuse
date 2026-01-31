/**
 * 渠道状态枚举
 */
export const ChannelStatus = {
  Pending: 'Pending',
  Sent: 'Sent',
  Delivered: 'Delivered',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const;

export type ChannelStatus = (typeof ChannelStatus)[keyof typeof ChannelStatus];
