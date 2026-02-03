/**
 * Task CRUD Operations - Template-level operations
 * 
 * This file contains DTOs for creating and updating task templates.
 * Task templates define the core structure and recurrence rules for tasks.
 */

import { z } from 'zod';
import { TaskTimeType } from '../value-objects';
import type { TaskTemplateClientDTO } from '../aggregates';

// ============================================================================
// Shared Schema (Reusable Components)
// ============================================================================

/**
 * 时间配置 Schema
 */
export const TaskTimeConfigSchema = z.object({
  mode: z.nativeEnum(TaskTimeType), // ALL_DAY | POINT | RANGE
  date: z.string().datetime(), // ISO 8601
  startTime: z.string().optional(), // "09:00"
  endTime: z.string().optional(),   // "10:00"
  isFloating: z.boolean().optional().default(false), // 是否浮动任务
});

export type TaskTimeConfigReq = z.infer<typeof TaskTimeConfigSchema>;

/**
 * 重复规则 Schema
 */
export const RecurrenceConfigSchema = z.object({
  rrule: z.string(), // "FREQ=DAILY;INTERVAL=1"
  timezone: z.string().optional(),
});

export type RecurrenceConfigReq = z.infer<typeof RecurrenceConfigSchema>;

/**
 * 检查项 Schema (创建时的初始数据)
 */
export const ChecklistItemSchema = z.object({
  title: z.string().min(1),
  sortOrder: z.number().int(),
});

export type ChecklistItemReq = z.infer<typeof ChecklistItemSchema>;

// ============================================================================
// CREATE Task Operations
// ============================================================================

/**
 * 创建任务 Schema
 */
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  folderId: z.string().uuid().optional(), // 属于哪个清单
  linkedKeyResultId: z.string().uuid().optional(), // 关联哪个 OKR
  timeConfig: TaskTimeConfigSchema.optional(),
  recurrence: RecurrenceConfigSchema.optional(),
  checklist: z.array(ChecklistItemSchema).optional(),
});

export type CreateTaskReq = z.infer<typeof CreateTaskSchema>;
export type CreateTaskRes = TaskTemplateClientDTO;

// ============================================================================
// UPDATE Task Operations
// ============================================================================

/**
 * 更新任务 Schema
 */
export const UpdateTaskSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
});

export type UpdateTaskReq = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskRes = TaskTemplateClientDTO;
