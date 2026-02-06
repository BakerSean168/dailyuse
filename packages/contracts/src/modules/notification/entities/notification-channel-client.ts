/**
 * NotificationChannel Entity - Client Interface
 * 通知渠道实体 - 客户端接口
 */

import type { NotificationChannelType, ChannelStatus } from '../value-objects';
import type { ChannelError, ChannelErrorDTO, ChannelResponse, ChannelResponseDTO } from '../value-objects';
import type { TransferDate, DomainDate, NotificationId, NotificationChannelId } from '@/primitives';

// ============ 实体接口 ============

/**
 * NotificationChannel 实体 - Client 接口
 */
export interface NotificationChannelClient {
  // 基础属性
  id: NotificationChannelId;
  notificationId: NotificationId;

  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;

  // 错误和响应信息
  error?: ChannelError | null;
  response?: ChannelResponse | null;

  // 同步字段
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;

  sentAt?: DomainDate | null;
  failedAt?: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * NotificationChannel Client DTO
 */
export interface NotificationChannelClientDTO {
  id: string;
  notificationId: string;
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

