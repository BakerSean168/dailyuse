/**
 * Domain Client - 客户端领域层
 *
 * 此包包含所有领域模块的客户端实现
 *
 * 导出规范：
 * - 直接导出类（聚合根、实体、值对象），可使用类方法
 * - 不使用命名空间导出
 * - 不使用类型别名导出（除非特殊需要）
 * - 保持简洁直观的命名
 */

// ==================== Task 模块 ====================
// 聚合根
export { TaskTemplate } from './task/aggregates/TaskTemplate';
export { TaskInstance } from './task/aggregates/TaskInstance';
export { TaskStatistics } from './task/aggregates/TaskStatistics';

// 实体
export { TaskTemplateHistory } from './task/entities/TaskTemplateHistory';

// 值对象
export {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
  CompletionRecord,
  SkipRecord,
} from './task/value-objects';

// ==================== Goal 模块 ====================
// 聚合根
export { Goal } from './goal/aggregates/Goal';
export { GoalFolder } from './goal/aggregates/GoalFolder';
export { GoalStatistics } from './goal/aggregates/GoalStatistics';

// 实体
export { KeyResult } from './goal/entities/KeyResult';
export { GoalRecord } from './goal/entities/GoalRecord';
export { GoalReview } from './goal/entities/GoalReview';

// 值对象
export {
  GoalMetadata,
  GoalTimeRange,
  GoalReminderConfig,
  KeyResultProgress,
  KeyResultSnapshot,
} from './goal/value-objects';

// ==================== Reminder 模块 ====================
// 聚合根
export { ReminderTemplate } from './reminder/aggregates/ReminderTemplate';
export { ReminderGroup } from './reminder/aggregates/ReminderGroup';
export { ReminderStatistics } from './reminder/aggregates/ReminderStatistics';

// 值对象
export {
  TriggerConfig,
  RecurrenceConfig,
  ActiveTimeConfig,
  ActiveHoursConfig,
  NotificationConfig,
  ReminderStats,
  GroupStats,
} from './reminder/value-objects';

// ==================== Schedule 模块 ====================
// 聚合根
export { Schedule, ScheduleTask } from './schedule/aggregates';

// 实体
export * from './schedule/entities';

// 值对象
export * from './schedule/value-objects';

// ==================== Editor 模块 ====================
// 聚合根
export { EditorWorkspaceClient } from './editor/aggregates';

// 实体
export * from './editor/entities';

// 值对象
export * from './editor/value-objects';

// ==================== Notification 模块 ====================
// 聚合根
export {
  NotificationClient,
  NotificationTemplateClient,
  NotificationPreferenceClient,
} from './notification/aggregates';

// 值对象
export * from './notification/value-objects';

// ==================== Repository 模块 ====================
// 聚合根
export { Repository } from './repository/aggregates/Repository';

// 实体
export { Folder } from './repository/entities/Folder';
export { Resource } from './repository/entities/Resource';
// export { LinkedContent } from './repository/entities/LinkedContent'; // Epic 7 - 待修复
// export { ResourceReference } from './repository/entities/ResourceReference'; // Epic 7 - 待修复
// export { RepositoryExplorer } from './repository/entities/RepositoryExplorer'; // Epic 7 - 待修复

// 值对象
export { RepositoryConfig } from './repository/value-objects/RepositoryConfig';
export { FolderMetadata } from './repository/value-objects/FolderMetadata';
export { ResourceMetadata } from './repository/value-objects/ResourceMetadata';
export { ResourceStats } from './repository/value-objects/ResourceStats';
// export { GitInfo } from './repository/value-objects/GitInfo'; // Epic 7 - 待修复
// export { SyncStatus } from './repository/value-objects/SyncStatus'; // Epic 7 - 待修复
export { RepositoryStats } from './repository/value-objects/RepositoryStats';

// ==================== Account 模块 ====================
// 聚合根
export { Account } from './account/aggregates/account';

// 实体
export { Subscription } from './account/entities/Subscription';
export { AccountHistory } from './account/entities/AccountHistory';

// ==================== Authentication 模块 ====================
// 聚合根
export { AuthCredential } from './authentication/aggregates/AuthCredential';
export { AuthSession } from './authentication/aggregates/AuthSession';

// 实体
export { PasswordCredential } from './authentication/entities/PasswordCredential';
export { ApiKeyCredential } from './authentication/entities/ApiKeyCredential';
export { RememberMeToken } from './authentication/entities/RememberMeToken';
export { RefreshToken } from './authentication/entities/RefreshToken';
export { CredentialHistory } from './authentication/entities/CredentialHistory';
export { SessionHistory } from './authentication/entities/SessionHistory';

// 值对象
export { DeviceInfo } from './authentication/value-objects/DeviceInfo';

// ==================== Setting 模块 ====================
// 聚合根
export { UserSetting } from './setting/aggregates/UserSetting';

// ==================== Dashboard 模块 ====================
// 聚合根
export { DashboardConfig } from './dashboard/aggregates/DashboardConfig';

// 值对象
export { WidgetConfig } from './dashboard/value-objects/WidgetConfig';

// ==================== AI 模块 ====================
export { AIConversation } from './ai/aggregates/AIConversation';
export { AIMessage } from './ai/entities/AIMessage';

// ==================== Sync 模块 ====================
// 聚合根
export { SyncSession } from './sync/aggregates/SyncSession';
export { SyncProfile } from './sync/aggregates/SyncProfile';
export { SyncState } from './sync/aggregates/SyncState';

// 实体
export { SyncConflict } from './sync/entities/SyncConflict';
export { PendingChange } from './sync/entities/PendingChange';

// 值对象
export {
  SyncVersion,
  EntityReference,
  SyncProfileConfig,
  SyncSessionStats,
  ConflictResolution,
} from './sync/value-objects';

// ==================== Example 模块（活文档参考实现）====================
// 聚合根
export { Example } from './example/aggregates/Example';

// 实体
export { ExampleHistory, ExampleHistoryActionClient } from './example/entities/ExampleHistory';
export type { ExampleHistoryActionClient as ExampleHistoryActionClientType } from './example/entities/ExampleHistory';
