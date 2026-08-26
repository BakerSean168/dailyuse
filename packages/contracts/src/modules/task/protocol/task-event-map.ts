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
  TaskPlanOutcomeChangedEvent,
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
  'task:instance-completed': TaskInstanceCompletedEvent;
  'task:instance-skipped': TaskInstanceSkippedEvent;
  'task:instance-deleted': TaskInstanceDeletedEvent;
  'task:instance-generated': TaskInstancesGeneratedEvent;
  'task:template-paused': TaskTemplatePausedEvent;
  'task:template-resumed': TaskTemplateResumedEvent;
  'task:template-schedule-time-changed': TaskTemplateScheduleTimeChangedEvent;
  'task:template-recurrence-changed': TaskTemplateRecurrenceChangedEvent;
  'task:instance-uncompleted': TaskUncompletedEvent;
  'task:plan-outcome-changed': TaskPlanOutcomeChangedEvent;
  'task:rescheduled': TaskRescheduledEvent;
};
