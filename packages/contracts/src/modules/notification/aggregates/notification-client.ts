/**
 * Notification Aggregate Root - Client Interface
 * 通知聚合根 - 客户端接口
 */

import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
} from '../value-objects';
import type { ImportanceLevel, UrgencyLevel } from '../../../shared/index';
import type { NotificationServerDTO } from './notification-server';
import type {
  NotificationChannelClient,
  NotificationChannelClientDTO,
} from '../entities/notification-channel-client';
import type {
  NotificationHistoryClient,
  NotificationHistoryClientDTO,
} from '../entities/notification-history-client';
import type {
  NotificationActionClient,
  NotificationActionClientDTO,
  NotificationMetadataClient,
  NotificationMetadataClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Notification Client DTO
 */
export interface NotificationClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  type: NotificationType;
  category: NotificationCategory;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  status: NotificationStatus;
  isRead: boolean;
  readAt?: number | null;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityUuid?: string | null;
  actions?: NotificationActionClientDTO[] | null;
  metadata?: NotificationMetadataClientDTO | null;
  expiresAt?: number | null;
  createdAt: number;
  updatedAt: number;
  sentAt?: number | null;
  deliveredAt?: number | null;
  deletedAt?: number | null;

  // UI 格式化属性
  isDeleted: boolean;
  isExpired: boolean;
  isPending: boolean;
  isSent: boolean;
  isDelivered: boolean;
  statusText: string;
  typeText: string;
  categoryText: string;
  importanceText: string;
  urgencyText: string;
  timeAgo: string; // "3 分钟前"
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedSentAt?: string;

  // ===== 子实体 DTO =====
  channels?: NotificationChannelClientDTO[] | null;
  history?: NotificationHistoryClientDTO[] | null;
}

// ============ 实体接口 ============

/**
 * Notification 聚合根 - Client 接口（实例方法）
 */
export interface NotificationClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  type: NotificationType;
  category: NotificationCategory;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  status: NotificationStatus;
  isRead: boolean;
  readAt?: number | null;

  // ===== 关联实体 =====
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityUuid?: string | null;

  // ===== 操作配置 =====
  actions?: NotificationActionClient[] | null;

  // ===== 元数据 =====
  metadata?: NotificationMetadataClient | null;

  // ===== 过期设置 =====
  expiresAt?: Date | null;

  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  sentAt?: number | null;
  deliveredAt?: number | null;
  deletedAt?: Date | null;

  // ===== UI 计算属性 =====
  isDeleted: boolean;
  isExpired: boolean;
  isPending: boolean;
  isSent: boolean;
  isDelivered: boolean;
  statusText: string;
  typeText: string;
  categoryText: string;
  importanceText: string;
  urgencyText: string;
  timeAgo: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedSentAt?: string;

  // ===== 子实体集合 =====

  /**
   * 渠道列表（懒加载，可选）
   */
  channels?: NotificationChannelClient[] | null;

  /**
   * 历史记录列表（懒加载，可选）
   */
  history?: NotificationHistoryClient[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：NotificationChannel（通过聚合根创建）
   */
  createChannel(params: {
    channelType: string;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannelClient;

  /**
   * 创建子实体：NotificationHistory（通过聚合根创建）
   */

  // ===== 子实体管理方法 =====

  /**
   * 添加渠道
   */

  /**
   * 移除渠道
   */

  /**
   * 获取所有渠道
   */

  /**
   * 通过类型获取渠道
   */

  /**
   * 获取所有历史记录
   */

  // ===== UI 业务方法 =====

  // 格式化展示

  // 操作判断

  // 操作

}
