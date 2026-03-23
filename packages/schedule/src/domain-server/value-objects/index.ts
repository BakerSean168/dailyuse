/**
 * Schedule Module Value Objects - Domain Server
 * 
 * 从 @dailyuse/domain-shared 重新导出值对象
 * 并导出领域服务器特有的错误类
 */

// IDs
export {
  ScheduleId,
  ScheduleTaskId,
  ScheduleExecutionId,
  ScheduleStatisticId,
} from '../../domain-shared/value-objects';

// Enum-like Value Objects
export {
  ScheduleTaskStatus,
  ExecutionStatus,
  TaskPriority,
  SourceModule,
  Timezone,
  ConflictSeverity,
} from '../../domain-shared/value-objects';

// Class-type Value Objects
export {
  ScheduleConfig,
  ExecutionInfo,
  RetryPolicy,
  ScheduleTaskMetadata,
  ConflictDetectionResult,
} from '../../domain-shared/value-objects';

export { TaskMetadata } from './TaskMetadata';

// ============ 领域服务器特有的错误类 ============
export * from './errors';
