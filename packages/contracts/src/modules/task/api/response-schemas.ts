/**
 * Task - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { TaskTemplateId, TaskInstanceId } from '../../../primitives';

/**
 * TaskTemplate Response Schema
 */
export const TaskTemplateResponseSchema = z.object({
  id: brandedId<TaskTemplateId>(),
  name: z.string(),
  taskType: z.string(),
  status: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const TaskTemplateListResponseSchema = z.object({
  templates: z.array(TaskTemplateResponseSchema),
  total: z.number(),
});

export const TaskDependencyResponseSchema = z.object({
  id: z.string(),
  predecessorTaskId: z.string(),
  successorTaskId: z.string(),
  dependencyType: z.string(),
  lagDays: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const TaskTemplateGraphResponseSchema = z.object({
  templates: z.array(TaskTemplateResponseSchema),
  dependencies: z.array(TaskDependencyResponseSchema),
  total: z.number(),
});

/**
 * TaskInstance Response Schema
 */
export const TaskInstanceResponseSchema = z.object({
  id: brandedId<TaskInstanceId>(),
  templateId: brandedId<TaskTemplateId>(),
  status: z.string(),
  scheduledDate: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
