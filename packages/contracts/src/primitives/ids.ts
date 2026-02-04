// ==========================================
// Strong-typed IDs
// 强类型 ID 定义
// ==========================================

// 使用 branded type pattern 创建名义类型
// 这样可以防止不同类型的 ID 被混用

/** 示例实体 ID */
export type ExampleId = string & { readonly __brand: 'ExampleId' };

/** 账户/身份 ID */
export type IdentityId = string & { readonly __brand: 'IdentityId' };

/** 认证凭证 ID */
export type AuthCredentialId = string & { readonly __brand: 'AuthCredentialId' };

/** 认证会话 ID */
export type AuthSessionId = string & { readonly __brand: 'AuthSessionId' };

/** 目标 ID */
export type GoalId = string & { readonly __brand: 'GoalId' };

/** 目标文件夹 ID */
export type GoalFolderId = string & { readonly __brand: 'GoalFolderId' };

/** 关键结果 ID */
export type KeyResultId = string & { readonly __brand: 'KeyResultId' };

/** 专注会话 ID */
export type FocusSessionId = string & { readonly __brand: 'FocusSessionId' };

/** 专注模式 ID */
export type FocusModeId = string & { readonly __brand: 'FocusModeId' };

/** 任务模板 ID */
export type TaskTemplateId = string & { readonly __brand: 'TaskTemplateId' };

/** 任务实例 ID */
export type TaskInstanceId = string & { readonly __brand: 'TaskInstanceId' };

/** 任务依赖 ID */
export type TaskDependencyId = string & { readonly __brand: 'TaskDependencyId' };

/** 任务文件夹 ID */
export type TaskFolderId = string & { readonly __brand: 'TaskFolderId' };

/** 提醒模板 ID */
export type ReminderTemplateId = string & { readonly __brand: 'ReminderTemplateId' };

/** 提醒分组 ID */
export type ReminderGroupId = string & { readonly __brand: 'ReminderGroupId' };

/** 提醒实例 ID */
export type ReminderInstanceId = string & { readonly __brand: 'ReminderInstanceId' };

/** 提醒历史 ID */
export type ReminderHistoryId = string & { readonly __brand: 'ReminderHistoryId' };

/** 提醒响应 ID */
export type ReminderResponseId = string & { readonly __brand: 'ReminderResponseId' };

/** 日程 ID */
export type ScheduleId = string & { readonly __brand: 'ScheduleId' };

/** 日程任务 ID */
export type ScheduleTaskId = string & { readonly __brand: 'ScheduleTaskId' };

/** 日程执行 ID */
export type ScheduleExecutionId = string & { readonly __brand: 'ScheduleExecutionId' };

/** 日程统计 ID */
export type ScheduleStatisticId = string & { readonly __brand: 'ScheduleStatisticId' };

/** 仓库 ID */
export type RepositoryId = string & { readonly __brand: 'RepositoryId' };

/** 资源 ID */
export type ResourceId = string & { readonly __brand: 'ResourceId' };

/** 文件夹 ID */
export type FolderId = string & { readonly __brand: 'FolderId' };

/** 文档 ID */
export type DocumentId = string & { readonly __brand: 'DocumentId' };

/** 文档版本 ID */
export type DocumentVersionId = string & { readonly __brand: 'DocumentVersionId' };

/** 文档链接 ID */
export type DocumentLinkId = string & { readonly __brand: 'DocumentLinkId' };

/** 设置 ID */
export type SettingId = string & { readonly __brand: 'SettingId' };

export type SettingEntryId = string & { readonly __brand: 'SettingEntryId' };

/** 设置历史 ID */
export type SettingHistoryId = string & { readonly __brand: 'SettingHistoryId' };

/** 设置分组 ID */
export type SettingGroupId = string & { readonly __brand: 'SettingGroupId' };

/** 通知 ID */
export type NotificationId = string & { readonly __brand: 'NotificationId' };

/** 通知渠道 ID */
export type NotificationChannelId = string & { readonly __brand: 'NotificationChannelId' };

/** 通知偏好 ID */
export type NotificationPreferenceId = string & { readonly __brand: 'NotificationPreferenceId' };

/** 通知模板 ID */
export type NotificationTemplateId = string & { readonly __brand: 'NotificationTemplateId' };

/** 通知历史 ID */
export type NotificationHistoryId = string & { readonly __brand: 'NotificationHistoryId' };

/** AI 对话 ID */
export type AiConversationId = string & { readonly __brand: 'AiConversationId' };

/** AI 消息 ID */
export type AiMessageId = string & { readonly __brand: 'AiMessageId' };

/** AI 生成任务 ID */
export type AiGenerationTaskId = string & { readonly __brand: 'AiGenerationTaskId' };

/** 同步配置 ID */
export type SyncProfileId = string & { readonly __brand: 'SyncProfileId' };

/** 同步会话 ID */
export type SyncSessionId = string & { readonly __brand: 'SyncSessionId' };

/** 同步冲突 ID */
export type SyncConflictId = string & { readonly __brand: 'SyncConflictId' };

/** 待同步变更 ID */
export type PendingChangeId = string & { readonly __brand: 'PendingChangeId' };

/** 数据快照 ID */
export type DataSnapshotId = string & { readonly __brand: 'DataSnapshotId' };

/** 编辑器工作区 ID */
export type EditorWorkspaceId = string & { readonly __brand: 'EditorWorkspaceId' };

/** 编辑器会话 ID */
export type EditorSessionId = string & { readonly __brand: 'EditorSessionId' };

/** 编辑器分组 ID */
export type EditorGroupId = string & { readonly __brand: 'EditorGroupId' };

/** 编辑器标签 ID */
export type EditorTabId = string & { readonly __brand: 'EditorTabId' };

/** 链接资源 ID */
export type LinkedResourceId = string & { readonly __brand: 'LinkedResourceId' };

/** 搜索引擎 ID */
export type SearchEngineId = string & { readonly __brand: 'SearchEngineId' };

/** 应用配置 ID */
export type AppConfigId = string & { readonly __brand: 'AppConfigId' };

/** 目标记录 ID */
export type GoalRecordId = string & { readonly __brand: 'GoalRecordId' };

/** 目标评审 ID */
export type GoalReviewId = string & { readonly __brand: 'GoalReviewId' };

/** 关键结果权重快照 ID */
export type KeyResultWeightSnapshotId = string & { readonly __brand: 'KeyResultWeightSnapshotId' };

/** 仪表盘 ID */
export type DashboardId = string & { readonly __brand: 'DashboardId' };

/** 仪表盘小部件 ID */
export type WidgetId = string & { readonly __brand: 'WidgetId' };

/** AI Provider 配置 ID */
export type AiProviderConfigId = string & { readonly __brand: 'AiProviderConfigId' };

/** AI 使用配额 ID */
export type AiUsageQuotaId = string & { readonly __brand: 'AiUsageQuotaId' };
