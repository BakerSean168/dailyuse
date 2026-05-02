import type {
  ScheduleTaskCreatedEvent,
  ScheduleTaskPausedEvent,
  ScheduleTaskResumedEvent,
  ScheduleTaskCompletedEvent,
  ScheduleTaskCancelledEvent,
  ScheduleTaskFailedEvent,
  ScheduleTaskExecutedEvent,
  ScheduleTaskScheduleUpdatedEvent,
  ScheduleTaskTriggeredEvent,
  CalendarEntryCreatedEvent,
  CalendarEntryUpdatedEvent,
  CalendarEntryRescheduledEvent,
  CalendarEntryDeletedEvent,
} from '../domain/events';

/**
 * Schedule Module - Event Map
 *
 * Event Naming Convention: schedule:<action>
 */

export type ScheduleEventMap = {
  'schedule:task:created': ScheduleTaskCreatedEvent;
  'schedule:task:paused': ScheduleTaskPausedEvent;
  'schedule:task:resumed': ScheduleTaskResumedEvent;
  'schedule:task:completed': ScheduleTaskCompletedEvent;
  'schedule:task:cancelled': ScheduleTaskCancelledEvent;
  'schedule:task:failed': ScheduleTaskFailedEvent;
  'schedule:task:executed': ScheduleTaskExecutedEvent;
  'schedule:task:schedule-updated': ScheduleTaskScheduleUpdatedEvent;
  'schedule:task:triggered': ScheduleTaskTriggeredEvent;

  'schedule:calendar-entry-created': CalendarEntryCreatedEvent;
  'schedule:calendar-entry-updated': CalendarEntryUpdatedEvent;
  'schedule:calendar-entry-rescheduled': CalendarEntryRescheduledEvent;
  'schedule:calendar-entry-deleted': CalendarEntryDeletedEvent;
};
