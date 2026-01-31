/**
 * NotificationChannel Entity - Server Interface
 * 通知渠道实体 - 服务端接口
 */

import type { NotificationChannelType, ChannelStatus } from '../enums';
import type { ChannelErrorServerDTO, ChannelResponseServerDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * NotificationChannel Server DTO
 */
export interface NotificationChannelServerDTO {
  uuid: string;
  notificationUuid: string;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null; // 邮箱、手机号等
  sendAttempts: number;
  maxRetries: number;
  error?: ChannelErrorServerDTO | null;
  response?: ChannelResponseServerDTO | null;
  createdAt: number; // epoch ms
  sentAt?: number | null; // epoch ms
  deliveredAt?: number | null; // epoch ms
  failedAt?: number | null; // epoch ms
}

/**
 * NotificationChannel Persistence DTO (数据库映射)
 */
export interface NotificationChannelPersistenceDTO {
  uuid: string;
  notificationUuid: string;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;
  error?: string | null; // JSON string
  response?: string | null; // JSON string
  createdAt: Date;
  sentAt?: number | null;
  deliveredAt?: number | null;
  failedAt?: Date | null;
}

// ============ 实体接口 ============

/**
 * NotificationChannel 实体 - Server 接口
 */
export interface NotificationChannelServer {
  // 基础属性
  uuid: string;
  notificationUuid: string;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient?: string | null;
  sendAttempts: number;
  maxRetries: number;

  // 错误和响应信息
  error?: ChannelErrorServerDTO | null;
  response?: ChannelResponseServerDTO | null;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
  sentAt?: number | null;
  deliveredAt?: number | null;
  failedAt?: Date | null;

  // ===== 业务方法 =====

  // 发送管理

  // 状态查询

  // 查询

  // ===== 转换方法 (To) =====
  /**
   * 转换为 Persistence DTO (数据库)
   */}
