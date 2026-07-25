/**
 * NotificationChannel Entity - Client Interface
 * 通知渠道实体 - 客户端接口
 *
 * Residual 861: sole fuller NotificationChannelClientDTO body;
 * Server is Omit of this type (see notification-channel-server.ts).
 */

import type { NotificationChannelType } from '../value-objects/notification-channel-type';
import type { ChannelStatus } from '../value-objects/channel-status';
import type { ChannelErrorDTO } from '../value-objects/channel-error';
import type { ChannelResponseDTO } from '../value-objects/channel-response';
import type { NotificationChannelId, NotificationId, TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * NotificationChannel Client DTO
 */
export interface NotificationChannelClientDTO {
  id: NotificationChannelId;
  notificationId: NotificationId;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;
  error?: ChannelErrorDTO | null;
  response?: ChannelResponseDTO | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  sentAt?: TransferDate | null;
  failedAt?: TransferDate | null;
}
