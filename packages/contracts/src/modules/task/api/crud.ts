/**
 * Task Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities）
 */

import { z } from 'zod';
import { TaskTimeType } from '../value-objects';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO } from '../aggregates';

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

// ============================================================================
// GET Task Operations
// ============================================================================

/**
 * 获取任务实例列表 Schema
 */
export const GetInstancesByRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeArchived: z.boolean().optional().default(false),
});

export type GetInstancesByRangeReq = z.infer<typeof GetInstancesByRangeSchema>;

export interface GetInstancesByRangeRes {
  data: TaskInstanceClientDTO[];
  total: number;
}

// ============================================================================
// RESCHEDULE Task Operations
// ============================================================================

/**
 * 重新调度任务 Schema
 */
export const RescheduleTaskSchema = z.object({
  instanceId: z.string().uuid(),
  newTime: TaskTimeConfigSchema,
});

export type RescheduleTaskReq = z.infer<typeof RescheduleTaskSchema>;
export type RescheduleTaskRes = TaskInstanceClientDTO;

// ============================================================================
// TASK Completion Operations
// ============================================================================

/**
 * 切换任务完成状态 Schema
 */
export const ToggleTaskCompletionSchema = z.object({
  instanceId: z.string().uuid(),
  note: z.string().optional(),
});

export type ToggleTaskCompletionReq = z.infer<typeof ToggleTaskCompletionSchema>;
export type ToggleTaskCompletionRes = TaskInstanceClientDTO;
