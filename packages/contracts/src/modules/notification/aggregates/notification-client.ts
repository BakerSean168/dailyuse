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
  NotificationChannelClientDTO,
} from '../entities/notification-channel-client';
import type { IdentityId, NotificationId, PersistenceDate, DomainDate, TransferDate } from '../../../primitives';

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
