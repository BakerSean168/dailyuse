/**
 * Notification Aggregate Root - Client Interface
 * 通知聚合根 - 客户端接口
 */

import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  NotificationMetadata,
  NotificationMetadataDTO,
  NotificationMetadataPersistenceDTO,
  NotificationAction,
  NotificationActionDTO,
  NotificationActionPersistenceDTO,
} from '../value-objects';
import type { ImportanceLevel } from '../../../shared/index';
import type {
  NotificationChannelClient,
  NotificationChannelClientDTO,
} from '../entities/notification-channel-client';
import type { IdentityId, NotificationId, PersistenceDate, DomainDate, TransferDate } from '@/primitives';

// ============ 实体接口 ============

/**
 * Notification 聚合根 - Client 接口
 */
export interface NotificationClient {
  // ===== 基础属性 =====
  id: NotificationId;
  identityId: IdentityId;

  title: string;
  content: string;
  type: NotificationType;

  category: NotificationCategory;
  importance: ImportanceLevel;

  status: NotificationStatus;
  readAt?: DomainDate | null;

  // ===== 操作配置 =====
  actions?: NotificationAction[] | null;

  // ===== 元数据 =====
  metadata?: NotificationMetadata | null;

  // ===== 同步字段 =====
  version: number;
  deletedAt: DomainDate | null;

  // ===== 时间戳 =====
  createdAt: DomainDate;
  updatedAt: DomainDate;

  /**
   * 渠道列表（懒加载，可选）
   */
  notificationChannels?: NotificationChannelClient[] | null;
}

// ============ DTO 定义 ============

/**
 * Notification Client DTO
 */
export interface NotificationClientDTO {
  id: string;
  identityId: string;

  title: string;
  content: string;
  type: NotificationType;

  category: NotificationCategory;
  importance: ImportanceLevel;

  isRead: boolean;
  readAt?: TransferDate | null;
  status: NotificationStatus;

  actions?: NotificationActionDTO[] | null;
  metadata?: NotificationMetadataDTO | null;

  // 同步字段
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // ===== 子实体 DTO =====
  notificationChannels?: NotificationChannelClientDTO[] | null;
}
