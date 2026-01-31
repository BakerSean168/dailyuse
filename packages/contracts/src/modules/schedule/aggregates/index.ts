/**
 * Schedule Module - Aggregates
 * 调度模块 - 聚合根统一导出
 */

// ============ Schedule Aggregate ============
export type {
  ScheduleServer,
  ScheduleServerDTO,
  SchedulePersistenceDTO,
} from './schedule-server';

export type {
  ScheduleClientDTO,
  ScheduleClient,
} from './schedule-client';

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

// ============ ScheduleStatistics Aggregate ============
export type {
  ScheduleStatisticsServerDTO,
  ScheduleStatisticsPersistenceDTO,
  ScheduleStatisticsCreatedEvent,
  ScheduleStatisticsUpdatedEvent,
  ScheduleStatisticsTaskCountChangedEvent,
  ScheduleStatisticsExecutionRecordedEvent,
  ScheduleStatisticsModuleUpdatedEvent,
  ScheduleStatisticsDomainEvent,
  ScheduleStatisticsServer,
  ScheduleStatisticsServerStatic,
} from './schedule-statistics-server';

export type {
  ScheduleStatisticsClientDTO,
  ScheduleStatisticsClient,
} from './schedule-statistics-client';
