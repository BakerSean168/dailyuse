/**
 * NotificationChannel Entity - Client Interface
 * 通知渠道实体 - 客户端接口
 */

import type { NotificationChannelType, ChannelStatus } from '../enums';
import type { NotificationChannelServerDTO } from './notification-channel-server';
import type { ChannelErrorClientDTO, ChannelResponseClientDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * NotificationChannel Client DTO
 */
export interface NotificationChannelClientDTO {
  uuid: string;
  notificationUuid: string;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;
  error?: ChannelErrorClientDTO | null;
  response?: ChannelResponseClientDTO | null;
  createdAt: number;
  sentAt?: number | null;
  deliveredAt?: number | null;
  failedAt?: number | null;

  // UI 格式化属性
  isPending: boolean;
  isSent: boolean;
  isDelivered: boolean;
  isFailed: boolean;
  canRetry: boolean;
  statusText: string;
  channelTypeText: string;
  formattedCreatedAt: string;
  formattedSentAt?: string;
  formattedDeliveredAt?: string;
}

// ============ 实体接口 ============

/**
 * NotificationChannel 实体 - Client 接口（实例方法）
 */
export interface NotificationChannelClient {
  // 基础属性
  uuid: string;
  notificationUuid: string;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;

  // 错误和响应信息
  error?: ChannelErrorClientDTO | null;
  response?: ChannelResponseClientDTO | null;

  // 时间戳
  createdAt: Date;
  sentAt?: number | null;
  deliveredAt?: number | null;
  failedAt?: Date | null;

  // UI 属性
  isPending: boolean;
  isSent: boolean;
  isDelivered: boolean;
  isFailed: boolean;
  canRetry: boolean;
  statusText: string;
  channelTypeText: string;
  formattedCreatedAt: string;
  formattedSentAt?: string;
  formattedDeliveredAt?: string;

  // ===== UI 业务方法 =====

  // 格式化展示

  // 操作

}
