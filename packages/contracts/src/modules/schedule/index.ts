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
} from './value-objects/ScheduleConfig';

export type {
  IExecutionInfoServer,
  IExecutionInfoClient,
  ExecutionInfoServerDTO,
  ExecutionInfoClientDTO,
  ExecutionInfoPersistenceDTO,
  ExecutionInfoServer,
  ExecutionInfoClient,
} from './value-objects/ExecutionInfo';

export type {
  IRetryPolicyServer,
  IRetryPolicyClient,
  RetryPolicyServerDTO,
  RetryPolicyClientDTO,
  RetryPolicyPersistenceDTO,
  RetryPolicyServer,
  RetryPolicyClient,
} from './value-objects/RetryPolicy';

export type {
  ITaskMetadataServer,
  ITaskMetadataClient,
  TaskMetadataServerDTO,
  TaskMetadataClientDTO,
  TaskMetadataPersistenceDTO,
  TaskMetadataServer,
  TaskMetadataClient,
} from './value-objects/TaskMetadata';

export type {
  IModuleStatisticsServer,
  IModuleStatisticsClient,
  ModuleStatisticsServerDTO,
  ModuleStatisticsClientDTO,
  ModuleStatisticsPersistenceDTO,
  ModuleStatisticsServer,
  ModuleStatisticsClient,
} from './value-objects/ModuleStatistics';

// ============ Entities ============
export type {
  ScheduleExecutionServerDTO,
  ScheduleExecutionPersistenceDTO,
  ScheduleExecutionServer,} from './entities/ScheduleExecutionServer';

export type {
  ScheduleExecutionClientDTO,
  ScheduleExecutionClient,} from './entities/ScheduleExecutionClient';

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
  ScheduleTaskServer,} from './aggregates/ScheduleTaskServer';

export type {
  ScheduleTaskClientDTO,
  ScheduleTaskClient,} from './aggregates/ScheduleTaskClient';

export type {
  ScheduleStatisticsServerDTO,
  ScheduleStatisticsPersistenceDTO,
  ScheduleStatisticsCreatedEvent,
  ScheduleStatisticsUpdatedEvent,
  ScheduleStatisticsTaskCountChangedEvent,
  ScheduleStatisticsExecutionRecordedEvent,
  ScheduleStatisticsModuleUpdatedEvent,
  ScheduleStatisticsDomainEvent,
  ScheduleStatisticsServer,} from './aggregates/ScheduleStatisticsServer';

export type {
  ScheduleStatisticsClientDTO,
  ScheduleStatisticsClient,} from './aggregates/ScheduleStatisticsClient';

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

export type { ScheduleServerDTO } from './aggregates/ScheduleServer';

export type { ScheduleClientDTO, ScheduleClient } from './aggregates/ScheduleClient';

// ============ Conflict Detection (Story 9.1) ============
export type {
  ConflictDetectionResult,
  ConflictDetail,
  ConflictSuggestion,
} from './value-objects/ConflictDetectionResult';

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
