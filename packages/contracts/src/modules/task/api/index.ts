/**
 * Task Module - API Export
 * 
 * 【规范说明：API 层导出】
 * 按功能分组，每个操作导出相关的 Schema、Request、Response 类型
 */

export {
  // Shared Schema
  TaskTimeConfigSchema,
  type TaskTimeConfigReq,
  RecurrenceConfigSchema,
  type RecurrenceConfigReq,
  ChecklistItemSchema,
  type ChecklistItemReq,

  // Create Task
  CreateTaskSchema,
  type CreateTaskReq,
  type CreateTaskRes,

  // Update Task
  UpdateTaskSchema,
  type UpdateTaskReq,
  type UpdateTaskRes,

  // Get Task Instances
  GetInstancesByRangeSchema,
  type GetInstancesByRangeReq,
  type GetInstancesByRangeRes,

  // Reschedule Task
  RescheduleTaskSchema,
  type RescheduleTaskReq,
  type RescheduleTaskRes,

  // Toggle Task Completion
  ToggleTaskCompletionSchema,
  type ToggleTaskCompletionReq,
  type ToggleTaskCompletionRes,
} from './crud';