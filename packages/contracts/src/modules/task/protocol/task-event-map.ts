import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent,
  TaskInstanceCompletedEvent,
  TaskInstanceSkippedEvent,
  TaskInstanceDeletedEvent,
  TaskInstancesGeneratedEvent,
  TaskTemplatePausedEvent,
  TaskTemplateResumedEvent,
  TaskTemplateScheduleTimeChangedEvent,
  TaskTemplateRecurrenceChangedEvent,
  TaskUncompletedEvent,
  TaskRescheduledEvent,
  TaskDependencyCreatedEvent,
  TaskDependencyUpdatedEvent,
  TaskDependencyDeletedEvent,
} from '../domain/events';

/**
 * Task Module - Event Map
 * 任务模块 - 事件映射
 *
 * 事件命名规范：task:{kebab-action-past-tense}
 */
export type TaskEventMap = {
  'task:created': TaskCreatedEvent;
  'task:updated': TaskUpdatedEvent;
  'task:deleted': TaskDeletedEvent;
  'task:instance:completed': TaskInstanceCompletedEvent;
  'task:instance:skipped': TaskInstanceSkippedEvent;
  'task:instance:deleted': TaskInstanceDeletedEvent;
  'task:instances:generated': TaskInstancesGeneratedEvent;
  'task:template:paused': TaskTemplatePausedEvent;
  'task:template:resumed': TaskTemplateResumedEvent;
  'task:template:schedule-time-changed': TaskTemplateScheduleTimeChangedEvent;
  'task:template:recurrence-changed': TaskTemplateRecurrenceChangedEvent;
  'task:uncompleted': TaskUncompletedEvent;
  'task:rescheduled': TaskRescheduledEvent;

  'task:dependency-created': TaskDependencyCreatedEvent;
  'task:dependency-updated': TaskDependencyUpdatedEvent;
  'task:dependency-deleted': TaskDependencyDeletedEvent;
};
