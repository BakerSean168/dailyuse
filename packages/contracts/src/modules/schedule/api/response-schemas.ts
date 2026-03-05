/**
 * Schedule - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { ScheduleTaskId, ScheduleId, IdentityId } from '../../../primitives';

/**
 * ScheduleTask Response Schema
 */
export const ScheduleTaskResponseSchema = z.object({
  id: brandedId<ScheduleTaskId>(),
  name: z.string(),
  sourceModule: z.string(),
  sourceEntityId: z.string(),
  status: z.string(),
  enabled: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * CalendarEntry (Schedule Event) Response Schema
 */
export const CalendarEntryResponseSchema = z.object({
  id: z.string(),
  identityId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number(),
  hasConflict: z.boolean(),
  conflictingEntries: z.array(z.string()).optional(),
  priority: z.number().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * BatchOperation Response Schema
 */
export const BatchOperationResponseSchema = z.object({
  success: z.array(z.string()),
  failed: z.array(z.object({ taskId: z.string(), error: z.string() })),
  total: z.number(),
  successCount: z.number(),
  failedCount: z.number(),
});
