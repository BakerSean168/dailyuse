/**
 * Schedule Module - Explicit Exports
 * 调度模块 - 显式导出
 */

// ============ Enums ============
export {
  ScheduleTaskStatus,
  ExecutionStatus,
  TaskPriority,
  SourceModule,
  Timezone,
  ConflictSeverity,
} from './enums';

// ============ Value Objects ============
export type {
  IScheduleConfigServer,
  IScheduleConfigClient,
  ScheduleConfigServerDTO,
  ScheduleConfigClientDTO,
  ScheduleConfigPersistenceDTO,
  ScheduleConfigServer,
  ScheduleConfigClient,
} from './value-objects/schedule-config';

export type {
  IExecutionInfoServer,
  IExecutionInfoClient,
  ExecutionInfoServerDTO,
  ExecutionInfoClientDTO,
  ExecutionInfoPersistenceDTO,
  ExecutionInfoServer,
  ExecutionInfoClient,
} from './value-objects/execution-info';

export type {
  IRetryPolicyServer,
  IRetryPolicyClient,
  RetryPolicyServerDTO,
  RetryPolicyClientDTO,
  RetryPolicyPersistenceDTO,
  RetryPolicyServer,
  RetryPolicyClient,
} from './value-objects/retry-policy';

export type {
  ITaskMetadataServer,
  ITaskMetadataClient,
  TaskMetadataServerDTO,
  TaskMetadataClientDTO,
  TaskMetadataPersistenceDTO,
  TaskMetadataServer,
  TaskMetadataClient,
} from './value-objects/task-metadata';

export type {
  IModuleStatisticsServer,
  IModuleStatisticsClient,
  ModuleStatisticsServerDTO,
  ModuleStatisticsClientDTO,
  ModuleStatisticsPersistenceDTO,
  ModuleStatisticsServer,
  ModuleStatisticsClient,
} from './value-objects/module-statistics';

// ============ Entities ============
export type {
  ScheduleExecutionServerDTO,
  ScheduleExecutionPersistenceDTO,
  ScheduleExecutionServer,} from './entities/schedule-execution-server';

export type {
  ScheduleExecutionClientDTO,
  ScheduleExecutionClient,} from './entities/schedule-execution-client';

// ============ Aggregates ============
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
  ScheduleTaskServer,} from './aggregates/schedule-task-server';

export type {
  ScheduleTaskClientDTO,
  ScheduleTaskClient,} from './aggregates/schedule-task-client';

export type {
  ScheduleStatisticsServerDTO,
  ScheduleStatisticsPersistenceDTO,
  ScheduleStatisticsCreatedEvent,
  ScheduleStatisticsUpdatedEvent,
  ScheduleStatisticsTaskCountChangedEvent,
  ScheduleStatisticsExecutionRecordedEvent,
  ScheduleStatisticsModuleUpdatedEvent,
  ScheduleStatisticsDomainEvent,
  ScheduleStatisticsServer,} from './aggregates/schedule-statistics-server';

export type {
  ScheduleStatisticsClientDTO,
  ScheduleStatisticsClient,} from './aggregates/schedule-statistics-client';

// ============ Event Types ============
export {
  ScheduleTaskEventTypes,
  ScheduleStatisticsEventTypes,
  ScheduleEventTypes,
} from './event-types';

export type {
  ScheduleTaskEventType,
  ScheduleStatisticsEventType,
  ScheduleEventType,
} from './event-types';

export type { ScheduleServerDTO } from './aggregates/schedule-server';

export type { ScheduleClientDTO, ScheduleClient } from './aggregates/schedule-client';

// ============ Conflict Detection (Story 9.1) ============
export type {
  ConflictDetectionResult,
  ConflictDetail,
  ConflictSuggestion,
} from './value-objects/conflict-detection-result';

// ============ API Requests ============
export { ResolutionStrategy } from './api-requests';

export type {
  CreateScheduleRequest,
  CreateScheduleResponseDTO,
  UpdateScheduleRequest,
  DetectConflictsRequest,
  DetectConflictsResponseDTO,
  GetSchedulesByTimeRangeRequest,
  ResolveConflictRequest,
  AppliedResolution,
  ResolveConflictResponseDTO,
  CreateScheduleTaskRequest,
  UpdateScheduleTaskRequest,
  UpdateScheduleConfigRequest,
  UpdateTaskMetadataRequest,
  ScheduleTaskQueryParamsDTO,
  BatchScheduleTaskOperationRequest,
  ScheduleTaskDTO,
  ScheduleTaskListResponseDTO,
  BatchOperationResponseDTO,
  ScheduleExecutionQueryParamsDTO,
  ScheduleExecutionDTO,
  ScheduleExecutionListResponseDTO,
  ExecutionHistoryStatsDTO,
  ScheduleStatisticsDTO,
  ScheduleDashboardStatsDTO,
  ModuleStatsResponseDTO,
  ScheduleOperationSuccessResponseDTO,
  ScheduleErrorResponseDTO,
} from './api-requests';
