/**
 * Notification Aggregate Root - Server Interface
 * 通知聚合根 - 服务端接口
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
  NotificationChannelServer,
  NotificationChannelServerDTO,
} from '../entities/notification-channel-server';
import type { IdentityId, NotificationId, PersistenceDate, DomainDate, TransferDate } from '@/primitives';


// ============ 实体接口 ============

/**
 * Notification 聚合根 - Server 接口（实例方法）
 */
export interface NotificationServer {
  // ===== 基础属性 =====
  id: NotificationId;
  identityId: IdentityId;

  title: string;
  content: string;
  type: NotificationType;

  category: NotificationCategory;
  importance: ImportanceLevel;

  status: NotificationStatus;
  isRead: boolean;
  readAt?: number | null;

  // ===== 操作配置 =====
  actions?: NotificationAction[] | null;

  // ===== 元数据 =====
  metadata?: NotificationMetadata | null;

  // ===== 时间戳 =====
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
  /**
   * 渠道列表（懒加载，可选）
   */
  notificationChannels?: NotificationChannelServer[] | null;

}


// ============ DTO 定义 ============

/**
 * Notification Server DTO
 */
export interface NotificationServerDTO {
  id: NotificationId;
  identityId: IdentityId;

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

  version: number;
  createdAt: TransferDate; 
  updatedAt: TransferDate; 
  deletedAt: TransferDate | null;

  // ===== 子实体 DTO =====
  notificationChannels?: NotificationChannelServerDTO[] | null; // 渠道列表（可选加载）
}

/**
 * Notification Persistence DTO
 */
export interface NotificationPersistenceDTO {
  id: NotificationId;
  identityId: IdentityId;

  title: string;
  content: string;
  type: NotificationType;

  category: NotificationCategory;
  importance: ImportanceLevel;

  status: NotificationStatus;
  isRead: boolean;
  readAt?: PersistenceDate | null;

  actions?: NotificationActionPersistenceDTO[] | null;
  metadata?: NotificationMetadataPersistenceDTO | null;

  notificationChannels?: string | null;

  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;

}