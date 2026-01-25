/**
 * NotificationChannel Entity - Client Interface
 * 通知渠道实体 - 客户端接口
 */

import type { NotificationChannelType, ChannelStatus } from '../enums';
import type { NotificationChannelServerDTO } from './NotificationChannelServer';
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
  getStatusBadge(): { text: string; color: string };
  getChannelIcon(): string;
  getStatusIcon(): string;

  // 操作
  retry(): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): NotificationChannelServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): NotificationChannelClientDTO;

  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): NotificationChannelClient;
}

/**
 * NotificationChannel 静态工厂方法接口
 */
export interface NotificationChannelClientStatic {
  /**
   * 创建新的 NotificationChannel 实体（静态工厂方法）
   */
  create(params: {
    notificationUuid: string;
    channelType: NotificationChannelType;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannelClient;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: NotificationChannelServerDTO): NotificationChannelClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: NotificationChannelClientDTO): NotificationChannelClient;
}
