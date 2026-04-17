import type { ScheduleTaskCreatedEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskPausedEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskResumedEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskCompletedEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskCancelledEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskFailedEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskExecutedEvent } from '../aggregates/schedule-task-server';
import type { ScheduleTaskScheduleUpdatedEvent } from '../aggregates/schedule-task-server';

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
};
