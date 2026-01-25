/**
 * Notification Aggregate Root - Client Interface
 * 通知聚合根 - 客户端接口
 */

import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
} from '../enums';
import type { ImportanceLevel, UrgencyLevel } from '../../../shared/index';
import type { NotificationServerDTO } from './NotificationServer';
import type {
  NotificationChannelClient,
  NotificationChannelClientDTO,
} from '../entities/NotificationChannelClient';
import type {
  NotificationHistoryClient,
  NotificationHistoryClientDTO,
} from '../entities/NotificationHistoryClient';
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
  createHistory(params: { action: string; details?: any }): NotificationHistoryClient;

  // ===== 子实体管理方法 =====

  /**
   * 添加渠道
   */
  addChannel(channel: NotificationChannelClient): void;

  /**
   * 移除渠道
   */
  removeChannel(channelUuid: string): NotificationChannelClient | null;

  /**
   * 获取所有渠道
   */
  getAllChannels(): NotificationChannelClient[];

  /**
   * 通过类型获取渠道
   */
  getChannelByType(type: string): NotificationChannelClient | null;

  /**
   * 获取所有历史记录
   */
  getHistory(): NotificationHistoryClient[];

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getTypeBadge(): { text: string; color: string };
  getTypeIcon(): string;
  getTimeText(): string;

  // 操作判断
  canMarkAsRead(): boolean;
  canDelete(): boolean;
  canExecuteActions(): boolean;

  // 操作
  markAsRead(): void;
  delete(): void;
  executeAction(actionId: string): void;
  navigate(): void; // 导航到关联实体

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): NotificationServerDTO;

  /**
   * 转换为 Client DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): NotificationClientDTO;

  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): NotificationClient;
}

/**
 * Notification 静态工厂方法接口
 */
export interface NotificationClientStatic {
  /**
   * 创建新的 Notification 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    actions?: NotificationActionClientDTO[];
    metadata?: NotificationMetadataClientDTO;
    expiresAt?: Date;
  }): NotificationClient;

  /**
   * 创建用于创建表单的空 Notification 实例
   */
  forCreate(accountUuid: string): NotificationClient;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: NotificationServerDTO): NotificationClient;

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  fromClientDTO(dto: NotificationClientDTO): NotificationClient;
}
