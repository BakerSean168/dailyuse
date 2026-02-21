import type {
  ScheduleTaskCreatedEvent,
  ScheduleTaskPausedEvent,
  ScheduleTaskResumedEvent,
  ScheduleTaskCompletedEvent,
  ScheduleTaskCancelledEvent,
  ScheduleTaskFailedEvent,
  ScheduleTaskExecutedEvent,
  ScheduleTaskScheduleUpdatedEvent,
} from '../aggregates';

/**
 * Schedule Module - Event Map
 *
 * Event Naming Convention: schedule:<action>
 */

export type ScheduleEventMap = {
  'schedule:task-create': ScheduleTaskCreatedEvent;
  'schedule:task-pause': ScheduleTaskPausedEvent;
  'schedule:task-resume': ScheduleTaskResumedEvent;
  'schedule:task-complete': ScheduleTaskCompletedEvent;
  'schedule:task-cancel': ScheduleTaskCancelledEvent;
  'schedule:task-fail': ScheduleTaskFailedEvent;
  'schedule:task-execute': ScheduleTaskExecutedEvent;
  'schedule:task-schedule-update': ScheduleTaskScheduleUpdatedEvent;
};
