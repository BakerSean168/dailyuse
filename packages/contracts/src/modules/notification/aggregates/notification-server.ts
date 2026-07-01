/**
 * Notification Aggregate Root - Server Interface
 * 通知聚合根 - 服务端接口
 */

import type { NotificationType } from '../value-objects/notification-type';
import type { NotificationCategory } from '../value-objects/notification-category';
import type { NotificationStatus } from '../value-objects/notification-status';
import type {
  NotificationMetadataDTO,
} from '../value-objects/notification-metadata';
import type {
  NotificationActionDTO,
} from '../value-objects/notification-action';
import type { ImportanceLevel } from '../../../shared/value-objects/importance';
import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import type {
  IdentityId,
  NotificationId,
  TransferDate,
} from '../../../primitives';

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
  expiresAt?: TransferDate | null;

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // ===== 子实体 DTO =====
  notificationChannels?: NotificationChannelServerDTO[] | null; // 渠道列表（可选加载）
}
