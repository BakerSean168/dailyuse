/**
 * Schedule Module - Aggregates
 * 调度模块 - 聚合根统一导出
 */

// ============ Schedule Aggregate ============
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
