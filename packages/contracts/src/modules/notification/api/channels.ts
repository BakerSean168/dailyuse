import { z } from 'zod';
import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import { NotificationChannelType } from '../value-objects';

// ============ 发送通知 ============

export const SendNotificationSchema = z.object({
  notificationUuid: z.string().uuid(),
  channels: z.array(z.nativeEnum(NotificationChannelType)).optional(),
});

export type SendNotificationReq = z.infer<typeof SendNotificationSchema>;
export type SendNotificationRes = { channelsUsed: NotificationChannelType[] };

// ============ 重试渠道 ============

export const RetryChannelSchema = z.object({
  channelUuid: z.string().uuid(),
});

export type RetryChannelReq = z.infer<typeof RetryChannelSchema>;
export type RetryChannelRes = NotificationChannelServerDTO;

// ============ 列表渠道 ============

export type ListNotificationChannelsReq = void;

export interface ListNotificationChannelsRes {
  channels: NotificationChannelServerDTO[];
  total: number;
}
