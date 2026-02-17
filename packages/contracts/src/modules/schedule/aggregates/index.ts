/**
 * Schedule Module - Aggregates
 * 调度模块 - 聚合根统一导出
 */

// ============ CalendarEntry Aggregate ============
export type {
  CalendarEntryServer,
  CalendarEntryServerDTO,
  CalendarEntryPersistenceDTO,
} from './calendar-entry-server';

export type {
  CalendarEntryClientDTO,
  CalendarEntryClient,
} from './calendar-entry-client';

// ============ Backward Compatibility (Deprecated) ============
export type {
  ScheduleJobServer,
  ScheduleJobServerDTO,
  SchedulePersistenceDTO,
} from './schedule-job-server';

export type {
  ScheduleJobClientDTO,
  ScheduleJobClient,
} from './schedule-job-client';

// ============ ScheduleTask Aggregate ============
export type {
  ScheduleTaskServerDTO,
  ScheduleTaskPersistenceDTO,
  ScheduleTaskCreatedEvent,
  ScheduleTaskPausedEvent,
  ScheduleTaskResumedEvent,
  ScheduleTaskCompletedEvent,
  ScheduleTaskCancelledEvent,
  ScheduleTaskFailedEvent,
  ScheduleTaskExecutedEvent,
  ScheduleTaskScheduleUpdatedEvent,
  ScheduleTaskDomainEvent,
  ScheduleTaskServer,
} from './schedule-task-server';

export type {
  ScheduleTaskClientDTO,
  ScheduleTaskClient,
} from './schedule-task-client';
