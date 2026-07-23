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
export { ConflictSuggestionType } from './conflict-detection-result';

// ============ Complex Value Objects ============
export type {
  IScheduleConfig,
  ScheduleConfigDTO,
} from './schedule-config';

export type {
  IExecutionInfo,
  ExecutionInfoDTO,
} from './execution-info';
export { ExecutionHealthStatus } from './execution-info';

export type {
  IRetryPolicy,
  RetryPolicyDTO,
} from './retry-policy';

export type {
  ITaskMetadata,
  TaskMetadataDTO,
} from './task-metadata';

export {
  ConflictDetailSchema,
  ConflictSuggestionSchema,
  ConflictDetectionResultSchema,
} from './conflict-detection-result';
export type {
  ConflictDetectionResult,
  ConflictDetail,
  ConflictSuggestion,
} from './conflict-detection-result';
