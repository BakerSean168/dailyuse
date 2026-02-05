/**
 * Schedule Module - Value Objects
 * 调度模块 - 值对象统一导出
 */

// ============ Enum Value Objects ============
export { ScheduleTaskStatus } from './schedule-task-status';
export { ExecutionStatus } from './execution-status';
export { TaskPriority } from './task-priority';
export { SourceModule } from './source-module';
export { Timezone } from './timezone';
export { ConflictSeverity } from './conflict-severity';

// ============ Complex Value Objects ============
export type {
  IScheduleConfigServer,
  IScheduleConfigClient,
  ScheduleConfigServerDTO,
  ScheduleConfigClientDTO,
  ScheduleConfigPersistenceDTO,
  ScheduleConfigServer,
  ScheduleConfigClient,
} from './schedule-config';

export type {
  IExecutionInfoServer,
  IExecutionInfoClient,
  ExecutionInfoServerDTO,
  ExecutionInfoClientDTO,
  ExecutionInfoPersistenceDTO,
  ExecutionInfoServer,
  ExecutionInfoClient,
} from './execution-info';

export type {
  IRetryPolicyServer,
  IRetryPolicyClient,
  RetryPolicyServerDTO,
  RetryPolicyClientDTO,
  RetryPolicyPersistenceDTO,
  RetryPolicyServer,
  RetryPolicyClient,
} from './retry-policy';

export type {
  ITaskMetadataServer,
  ITaskMetadataClient,
  TaskMetadataServerDTO,
  TaskMetadataClientDTO,
  TaskMetadataPersistenceDTO,
  TaskMetadataServer,
  TaskMetadataClient,
} from './task-metadata';

export type { ConflictDetectionResult, ConflictDetail, ConflictSuggestion } from './conflict-detection-result';
