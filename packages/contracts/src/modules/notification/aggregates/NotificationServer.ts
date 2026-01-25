/**
 * Notification Aggregate Root - Server Interface
 * 通知聚合根 - 服务端接口
 */

import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
} from '../enums';
import type { ImportanceLevel, UrgencyLevel } from '../../../shared/index';
import type {
  NotificationChannelServer,
  NotificationChannelServerDTO,
} from '../entities/NotificationChannelServer';
import type {
  NotificationHistoryServer,
  NotificationHistoryServerDTO,
} from '../entities/NotificationHistoryServer';
import type {
  NotificationActionServer,
  NotificationActionServerDTO,
  NotificationMetadataServer,
  NotificationMetadataServerDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Notification Server DTO
 */
export interface NotificationServerDTO {
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
  readAt?: number | null; // epoch ms
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityUuid?: string | null;
  actions?: NotificationActionServerDTO[] | null;
  metadata?: NotificationMetadataServerDTO | null;
  expiresAt?: number | null; // epoch ms
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  sentAt?: number | null; // epoch ms
  deliveredAt?: number | null; // epoch ms
  deletedAt?: number | null;

  // ===== 子实体 DTO =====
  channels?: NotificationChannelServerDTO[] | null; // 渠道列表（可选加载）
  history?: NotificationHistoryServerDTO[] | null; // 历史记录（可选加载）
}

/**
 * Notification Persistence DTO (数据库映射)
 */
export interface NotificationPersistenceDTO {
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
  actions?: string | null; // JSON string
  metadata?: string | null; // JSON string
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: number | null;
  deliveredAt?: number | null;
  deletedAt?: Date | null;
}

// ============ 领域事件 ============

/**
 * 通知创建事件
 */
export interface NotificationCreatedEvent {
  type: 'notification.created';
  aggregateId: string; // notificationUuid
  timestamp: Date; // epoch ms
  payload: {
    notification: NotificationServerDTO;
    sendImmediately: boolean;
  };
}

/**
 * 通知发送事件
 */
export interface NotificationSentEvent {
  type: 'notification.sent';
  aggregateId: string;
  timestamp: Date;
  payload: {
    notificationUuid: string;
    channels: string[]; // 渠道类型列表
  };
}

/**
 * 通知已读事件
 */
export interface NotificationReadEvent {
  type: 'notification.read';
  aggregateId: string;
  timestamp: Date;
  payload: {
    notificationUuid: string;
    readAt: number;
  };
}

/**
 * 通知删除事件
 */
export interface NotificationDeletedEvent {
  type: 'notification.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    notificationUuid: string;
  };
}

/**
 * 通知状态变更事件
 */
export interface NotificationStatusChangedEvent {
  type: 'notification.status.changed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    previousStatus: NotificationStatus;
    newStatus: NotificationStatus;
    reason?: string;
  };
}

/**
 * Notification 领域事件联合类型
 */
export type NotificationDomainEvent =
  | NotificationCreatedEvent
  | NotificationSentEvent
  | NotificationReadEvent
  | NotificationDeletedEvent
  | NotificationStatusChangedEvent;

// ============ 实体接口 ============

/**
 * Notification 聚合根 - Server 接口（实例方法）
 */
export interface NotificationServer {
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
  actions?: NotificationActionServer[] | null;

  // ===== 元数据 =====
  metadata?: NotificationMetadataServer | null;

  // ===== 过期设置 =====
  expiresAt?: Date | null;

  // ===== 时间戳 (统一使用 number epoch ms) =====
  createdAt: Date;
  updatedAt: Date;
  sentAt?: number | null;
  deliveredAt?: number | null;
  deletedAt?: Date | null;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 渠道列表（懒加载，可选）
   */
  channels?: NotificationChannelServer[] | null;

  /**
   * 历史记录列表（懒加载，可选）
   */
  history?: NotificationHistoryServer[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：NotificationChannel（通过聚合根创建）
   */
  createChannel(params: {
    channelType: string;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannelServer;

  /**
   * 创建子实体：NotificationHistory（通过聚合根创建）
   */
  createHistory(params: { action: string; details?: any }): NotificationHistoryServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加渠道
   */
  addChannel(channel: NotificationChannelServer): void;

  /**
   * 移除渠道
   */
  removeChannel(channelUuid: string): NotificationChannelServer | null;

  /**
   * 获取所有渠道
   */
  getAllChannels(): NotificationChannelServer[];

  /**
   * 通过类型获取渠道
   */
  getChannelByType(type: string): NotificationChannelServer | null;

  /**
   * 添加历史记录
   */
  addHistory(action: string, details?: any): void;

  /**
   * 获取所有历史记录
   */
  getHistory(): NotificationHistoryServer[];

  // ===== 业务方法 =====

  // 状态管理
  send(): Promise<void>;
  markAsRead(): void;
  markAsUnread(): void;
  cancel(): void;
  softDelete(): void;
  restore(): void;

  // 状态查询
  isExpired(): boolean;
  isPending(): boolean;
  isSent(): boolean;
  isDelivered(): boolean;
  hasBeenRead(): boolean;

  // 操作处理
  executeAction(actionId: string): Promise<void>;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): NotificationServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   * 注意：子实体在数据库中是独立表，不包含在 Persistence DTO 中
   */
  toPersistenceDTO(): NotificationPersistenceDTO;
}

/**
 * Notification 静态工厂方法接口
 */
export interface NotificationServerStatic {
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
    actions?: NotificationActionServerDTO[];
    metadata?: NotificationMetadataServerDTO;
    expiresAt?: Date;
  }): NotificationServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: NotificationServerDTO): NotificationServer;

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
  fromPersistenceDTO(dto: NotificationPersistenceDTO): NotificationServer;
}
