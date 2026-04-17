/**
 * NotificationChannel Entity - Server Interface
 * 通知渠道实体 - 服务端接口
 */

import type { NotificationId, PersistenceDate, TransferDate } from '../../../primitives';
import type { NotificationChannelType } from '../value-objects/notification-channel-type';
import type { ChannelStatus } from '../value-objects/channel-status';
import type { ChannelErrorDTO } from '../value-objects/channel-error';
import type { ChannelResponseDTO } from '../value-objects/channel-response';

// ============ DTO 定义 ============

/**
 * NotificationChannel Server DTO
 */
export interface NotificationChannelServerDTO {
  id: string;
  notificationId: string;
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

/**
 * NotificationChannel Persistence DTO (数据库映射)
 */
export interface NotificationChannelPersistenceDTO {
  id: string;
  notificationId: NotificationId;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;
  error?: string | null; // JSON string
  response?: string | null; // JSON string
  createdAt: Date;
  sentAt?: PersistenceDate | null;
  failedAt?: PersistenceDate | null;
}
