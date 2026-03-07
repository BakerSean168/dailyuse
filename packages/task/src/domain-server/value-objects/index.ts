/**
 * Task Module Value Objects - Domain Server
 *
 * 从 @dailyuse/domain-shared 重新导出值对象
 * 并导出领域服务器特有的错误类
 */

// IDs
export {
  TaskTemplateId,
  TaskInstanceId,
  TaskDependencyId,
  TaskFolderId,
} from '../../domain-shared/value-objects';

// Type Value Objects (Enums)
export {
  TaskTemplateStatus,
  TaskInstanceStatus,
  TaskTimeType,
} from '../../domain-shared/value-objects';

// 从 contracts 重新导出 DependencyType/DependencyStatus/TaskType
export { DependencyType, DependencyStatus, TaskType } from '@dailyuse/contracts/task';

// Class Value Objects
export {
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
  TaskTimeConfig,
  CompletionRecord,
  ChecklistItemDefinition,
} from '../../domain-shared/value-objects';

// Server-specific Value Objects
export { SkipRecord } from './SkipRecord';

// ============ 领域服务器特有的错误类 ============
export * from './TaskErrors';
