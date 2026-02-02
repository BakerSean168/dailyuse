import { z } from 'zod';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
} from '../value-objects';
import type { ImportanceLevel, UrgencyLevel } from '../../../shared';

// ============ 创建通知 ============

export const CreateNotificationSchema = z.object({
  accountUuid: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  category: z.nativeEnum(NotificationCategory),
  importance: z.string().optional(),
  urgency: z.string().optional(),
  relatedEntityType: z.nativeEnum(RelatedEntityType).optional(),
  relatedEntityUuid: z.string().uuid().optional(),
  actions: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.number().int().optional(),
  sendImmediately: z.boolean().optional().default(false),
  channels: z.array(z.nativeEnum(NotificationChannelType)).optional(),
});

export type CreateNotificationReq = z.infer<typeof CreateNotificationSchema>;
export type CreateNotificationRes = NotificationServerDTO;

// ============ 更新通知 ============

export const UpdateNotificationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.number().int().optional(),
});

export type UpdateNotificationReq = z.infer<typeof UpdateNotificationSchema>;
export type UpdateNotificationRes = NotificationServerDTO;

// ============ 查询通知 ============

export const NotificationQuerySchema = z.object({
  accountUuid: z.string().uuid().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  category: z.nativeEnum(NotificationCategory).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  isRead: z.boolean().optional(),
  relatedEntityType: z.nativeEnum(RelatedEntityType).optional(),
  relatedEntityUuid: z.string().uuid().optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  keyword: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'sentAt', 'importance', 'urgency']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;

export interface NotificationListRes {
  notifications: NotificationServerDTO[];
  total: number;
  page: number;
  limit: number;
}

// ============ 批量操作 ============

export const MarkAsReadBatchSchema = z.object({
  notificationUuids: z.array(z.string().uuid()).min(1),
});

export type MarkAsReadBatchReq = z.infer<typeof MarkAsReadBatchSchema>;
export type MarkAsReadBatchRes = { updatedCount: number };

export const DeleteNotificationsBatchSchema = z.object({
  notificationUuids: z.array(z.string().uuid()).min(1),
});

export type DeleteNotificationsBatchReq = z.infer<typeof DeleteNotificationsBatchSchema>;
export type DeleteNotificationsBatchRes = { deletedCount: number };

export const CleanupOldNotificationsSchema = z.object({
  accountUuid: z.string().uuid(),
  beforeDays: z.number().int().min(1),
  category: z.nativeEnum(NotificationCategory).optional(),
});

export type CleanupOldNotificationsReq = z.infer<typeof CleanupOldNotificationsSchema>;
export type CleanupOldNotificationsRes = { deletedCount: number };

// ============ 统计 ============

export type GetNotificationStatsReq = void;

export interface NotificationStatsRes {
  unreadCount: number;
  totalCount: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
}

// ============ 执行操作 ============

export const ExecuteNotificationActionSchema = z.object({
  notificationUuid: z.string().uuid(),
  actionId: z.string(),
});

export type ExecuteNotificationActionReq = z.infer<typeof ExecuteNotificationActionSchema>;
export type ExecuteNotificationActionRes = NotificationServerDTO;
