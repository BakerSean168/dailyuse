/**
 * 任务模块事件类型定义与导出
 * 从 @dailyuse/contracts 重新导出所有事件类型
 * 确保 domain 是事件类型的单一访问点
 */

// Re-export all event types from contracts
// This ensures domain is the primary export point for events
export type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent,
  TaskUncompletedEvent,
  TaskInstanceCompletedEvent,
  TaskInstancesGeneratedEvent,
  TaskTemplatePausedEvent,
  TaskTemplateResumedEvent,
  TaskTemplateScheduleTimeChangedEvent,
  TaskTemplateRecurrenceChangedEvent,
} from '@dailyuse/contracts/task';

export type { TaskEventMap } from '@dailyuse/contracts/task';
