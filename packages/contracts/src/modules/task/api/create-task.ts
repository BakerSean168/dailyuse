import { z } from 'zod';
import { TaskTimeType } from '../value-objects'; // 假设你有 enum 定义

// === 子对象 Schema (复用) ===

// 时间配置 Schema
export const TaskTimeConfigSchema = z.object({
  mode: z.nativeEnum(TaskTimeType), // ALL_DAY | POINT | RANGE
  date: z.string().datetime(), // ISO 8601
  startTime: z.string().optional(), // "09:00"
  endTime: z.string().optional(),   // "10:00"
  isFloating: z.boolean().optional().default(false), // 是否浮动任务
});

// 重复规则 Schema
export const RecurrenceConfigSchema = z.object({
  rrule: z.string(), // "FREQ=DAILY;INTERVAL=1"
  timezone: z.string().optional(),
});

// 检查项 Schema (创建时的初始数据)
export const ChecklistItemSchema = z.object({
  title: z.string().min(1),
  sortOrder: z.number().int(),
});

// === 主请求 Schema ===

export const CreateTaskSchema = z.object({
  // 基础信息
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),

  // 归属
  folderId: z.string().uuid().optional(), // 属于哪个清单
  linkedKeyResultId: z.string().uuid().optional(), // 关联哪个 OKR
  
  // 调度配置 (如果是待办，这俩都是 undefined)
  timeConfig: TaskTimeConfigSchema.optional(),
  recurrence: RecurrenceConfigSchema.optional(),
  
  // 初始子任务
  checklist: z.array(ChecklistItemSchema).optional(),
});

// 导出类型供前端和 RPC Map 使用
export type CreateTaskReq = z.infer<typeof CreateTaskSchema>;