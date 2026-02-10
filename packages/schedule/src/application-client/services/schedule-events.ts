/**
 * Schedule Events
 *
 * 日程模块事件常量
 */

export const ScheduleTaskEvents = {
  TASK_CREATED: 'schedule:task:created',
  TASK_UPDATED: 'schedule:task:updated',
  TASK_DELETED: 'schedule:task:deleted',
  TASK_PAUSED: 'schedule:task:paused',
  TASK_RESUMED: 'schedule:task:resumed',
  TASK_COMPLETED: 'schedule:task:completed',
  TASK_CANCELLED: 'schedule:task:cancelled',
  TASKS_BATCH_CREATED: 'schedule:tasks:batch-created',
  TASKS_BATCH_DELETED: 'schedule:tasks:batch-deleted',
  METADATA_UPDATED: 'schedule:task:metadata-updated',
  STATISTICS_RECALCULATED: 'schedule:statistics:recalculated',
  STATISTICS_RESET: 'schedule:statistics:reset',
  STATISTICS_DELETED: 'schedule:statistics:deleted',
} as const;

export const ScheduleEventEvents = {
  SCHEDULE_CREATED: 'schedule:event:created',
  SCHEDULE_UPDATED: 'schedule:event:updated',
  SCHEDULE_DELETED: 'schedule:event:deleted',
  CONFLICT_DETECTED: 'schedule:event:conflict-detected',
  CONFLICT_RESOLVED: 'schedule:event:conflict-resolved',
} as const;

export interface ScheduleTaskRefreshEvent {
  taskUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ScheduleEventRefreshEvent {
  scheduleUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ScheduleConflictEvent {
  scheduleUuid: string;
  conflictingUuids: string[];
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
