/**
 * Notification - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId, NotificationId } from '../../../primitives';
import { NotificationType } from '../value-objects/notification-type';
import { NotificationCategory } from '../value-objects/notification-category';
import { NotificationStatus } from '../value-objects/notification-status';

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
