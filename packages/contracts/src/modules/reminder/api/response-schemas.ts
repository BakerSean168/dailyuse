/**
 * Reminder - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { ReminderTemplateId, ReminderGroupId } from '@/primitives';

/**
 * ReminderTemplate Response Schema
 */
export const ReminderTemplateResponseSchema = z.object({
  id: brandedId<ReminderTemplateId>(),
  title: z.string(),
  type: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * ReminderGroup Response Schema
 */
export const ReminderGroupResponseSchema = z.object({
  id: brandedId<ReminderGroupId>(),
  name: z.string(),
  controlMode: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * BatchResult Schema (shared pattern for batch operations)
 */
export const ReminderBatchResultSchema = z.object({
  successCount: z.number(),
  failedCount: z.number(),
});
