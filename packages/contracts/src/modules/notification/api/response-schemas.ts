/**
 * Notification - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { NotificationId } from '@/primitives';

/**
 * Notification Response Schema
 */
export const NotificationResponseSchema = z.object({
  id: brandedId<NotificationId>(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  category: z.string(),
  status: z.string(),
  isRead: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * BatchResult Schema
 */
export const NotificationBatchResultSchema = z.object({
  successCount: z.number(),
  failedCount: z.number(),
});
