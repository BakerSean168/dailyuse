/**
 * Schedule Event Types
 * 调度模块事件类型常量
 *
 * 统一事件命名规范：
 * - 使用小写点分隔格式: module.entity.action
 * - 例如: schedule.task.created, schedule.task.executed
 *
 * @module @dailyuse/contracts/schedule
 */

// ============ ScheduleTask 事件类型 ============

/**
 * ScheduleTask 事件类型枚举
 */
export const ScheduleTaskEventTypes = {
  /** 任务创建 */
  CREATED: 'schedule.task.created',

  /** 任务暂停 */
  PAUSED: 'schedule.task.paused',

  /** 任务恢复 */
  RESUMED: 'schedule.task.resumed',

  /** 任务完成 */
  COMPLETED: 'schedule.task.completed',

  /** 任务取消 */
  CANCELLED: 'schedule.task.cancelled',

  /** 任务失败 */
  FAILED: 'schedule.task.failed',

  /** 任务执行（核心触发事件 - 其他模块监听此事件）*/
  EXECUTED: 'schedule.task.executed',

  /** 任务触发（内部使用，触发执行前）*/
  TRIGGERED: 'schedule.task.triggered',

  /** 调度配置更新 */
  SCHEDULE_UPDATED: 'schedule.task.schedule.updated',
} as const;

/**
 * ScheduleTask 事件类型联合类型
 */
export type ScheduleTaskEventType =
  (typeof ScheduleTaskEventTypes)[keyof typeof ScheduleTaskEventTypes];

// ============ 所有 Schedule 事件类型 ============

/**
 * 所有 Schedule 模块事件类型
 */
export const ScheduleEventTypes = {
  ...ScheduleTaskEventTypes,
} as const;

/**
 * Schedule 事件类型联合类型
 */
export type ScheduleEventType = ScheduleTaskEventType;
