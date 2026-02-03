/**
 * Notification Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities/dtos）
 */

import { z } from 'zod';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import type { NotificationPreferenceServerDTO } from '../aggregates/notification-preference-server';
import type {
  NotificationListResultDTO,
  NotificationStatsDTO,
  SendNotificationResultDTO,
  ListNotificationChannelsResultDTO,
  BatchOperationResultDTO,
} from '../dtos';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
} from '../value-objects';

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
export type NotificationListRes = NotificationListResultDTO;

// ============ 批量操作 ============

export const MarkAsReadBatchSchema = z.object({
  notificationUuids: z.array(z.string().uuid()).min(1),
});

export type MarkAsReadBatchReq = z.infer<typeof MarkAsReadBatchSchema>;
export type MarkAsReadBatchRes = BatchOperationResultDTO;

export const DeleteNotificationsBatchSchema = z.object({
  notificationUuids: z.array(z.string().uuid()).min(1),
});

export type DeleteNotificationsBatchReq = z.infer<typeof DeleteNotificationsBatchSchema>;
export type DeleteNotificationsBatchRes = BatchOperationResultDTO;

export const CleanupOldNotificationsSchema = z.object({
  accountUuid: z.string().uuid(),
  beforeDays: z.number().int().min(1),
  category: z.nativeEnum(NotificationCategory).optional(),
});

export type CleanupOldNotificationsReq = z.infer<typeof CleanupOldNotificationsSchema>;
export type CleanupOldNotificationsRes = BatchOperationResultDTO;

// ============ 统计 ============

export type GetNotificationStatsReq = void;
export type GetNotificationStatsRes = NotificationStatsDTO;

// ============ 执行操作 ============

export const ExecuteNotificationActionSchema = z.object({
  notificationUuid: z.string().uuid(),
  actionId: z.string(),
});

export type ExecuteNotificationActionReq = z.infer<typeof ExecuteNotificationActionSchema>;
export type ExecuteNotificationActionRes = NotificationServerDTO;

// ============================================================================
// CHANNEL Operations
// ============================================================================

/**
 * 发送通知 Schema
 */
export const SendNotificationSchema = z.object({
  notificationUuid: z.string().uuid(),
  channels: z.array(z.nativeEnum(NotificationChannelType)).optional(),
});

export type SendNotificationReq = z.infer<typeof SendNotificationSchema>;
export type SendNotificationRes = SendNotificationResultDTO;

/**
 * 重试渠道 Schema
 */
export const RetryChannelSchema = z.object({
  channelUuid: z.string().uuid(),
});

export type RetryChannelReq = z.infer<typeof RetryChannelSchema>;
export type RetryChannelRes = NotificationChannelServerDTO;

/**
 * 列表渠道
 */
export type ListNotificationChannelsReq = void;
export type ListNotificationChannelsRes = ListNotificationChannelsResultDTO;

// ============================================================================
// PREFERENCE Operations
// ============================================================================

/**
 * 更新通知偏好 Schema
 */
export const UpdateNotificationPreferenceSchema = z.object({
  enabled: z.boolean().optional(),
  channels: z.object({
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  categories: z.object({
    task: z.any().optional(),
    goal: z.any().optional(),
    schedule: z.any().optional(),
    reminder: z.any().optional(),
    account: z.any().optional(),
    system: z.any().optional(),
  }).optional(),
  doNotDisturb: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
  }).optional(),
  rateLimit: z.object({
    enabled: z.boolean(),
    maxPerHour: z.number().int().min(1),
    maxPerDay: z.number().int().min(1),
  }).optional(),
});

export type UpdateNotificationPreferenceReq = z.infer<typeof UpdateNotificationPreferenceSchema>;
export type UpdateNotificationPreferenceRes = NotificationPreferenceServerDTO;

/**
 * 获取通知偏好
 */
export type GetNotificationPreferenceReq = void;
export type GetNotificationPreferenceRes = NotificationPreferenceServerDTO;
