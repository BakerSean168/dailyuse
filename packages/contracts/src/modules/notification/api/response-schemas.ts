/**
 * Notification - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId, NotificationId, NotificationPreferenceId } from '../../../primitives';
import { NotificationType } from '../value-objects/notification-type';
import { NotificationCategory } from '../value-objects/notification-category';
import { NotificationStatus } from '../value-objects/notification-status';
import { NotificationChannelType } from '../value-objects/notification-channel-type';

/**
 * Notification Response Schema
 */
export const NotificationResponseSchema = z.object({
  id: brandedId<NotificationId>(),
  identityId: brandedId<IdentityId>(),
  title: z.string(),
  content: z.string(),
  type: z.enum(NotificationType),
  category: z.enum(NotificationCategory),
  status: z.enum(NotificationStatus),
  isRead: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * BatchResult Schema
 * Residual 799: BatchOperationResultDTO dual retired — this schema is the sole batch-result shape
 * (semantic BatchOperationResultDTO is z.infer alias).
 */
export const NotificationBatchResultSchema = z.object({
  updatedCount: z.number().optional(),
  deletedCount: z.number().optional(),
});

/**
 * Unread Count Response Schema
 */
export const UnreadCountResponseSchema = z.object({
  count: z.number(),
});

/**
 * Notification Preference Response Schema (residual 196)
 */
export const NotificationPreferenceResponseSchema = z.object({
  id: brandedId<NotificationPreferenceId>(),
  identityId: brandedId<IdentityId>(),
  settings: z.record(z.string(), z.array(z.enum(NotificationChannelType))),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

