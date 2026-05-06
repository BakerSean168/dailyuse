/**
 * NotificationChannel Entity - Server Interface
 * 通知渠道实体 - 服务端接口
 */

import type { NotificationChannelId, NotificationId, TransferDate } from '../../../primitives';
import type { NotificationChannelType } from '../value-objects/notification-channel-type';
import type { ChannelStatus } from '../value-objects/channel-status';
import type { ChannelErrorDTO } from '../value-objects/channel-error';
import type { ChannelResponseDTO } from '../value-objects/channel-response';

// ============ DTO 定义 ============

/**
 * NotificationChannel Server DTO
 */
export interface NotificationChannelServerDTO {
  id: NotificationChannelId;
  notificationId: NotificationId;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;
  error?: ChannelErrorDTO | null;
  response?: ChannelResponseDTO | null;
  createdAt: TransferDate;
  sentAt?: TransferDate | null;
  failedAt?: TransferDate | null;
}
