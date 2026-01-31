/**
 * Task Module - Explicit Exports
 * 任务模块 - 显式导出
 *
 * ImportanceLevel 和 UrgencyLevel 从 @dailyuse/contracts/shared 导入
 */

// ============ Enums ============
export {
  TaskType,
  TimeType,
  TaskScheduleMode,
  TaskTemplateStatus,
  TaskInstanceStatus,
  RecurrenceFrequency,
  DayOfWeek,
  RecurrenceEndConditionType,
  TaskReminderType,
  ReminderTimeUnit,
  DependencyType,
  DependencyStatus,
} from './enums';

// ============ Shared Enums ============
export { ImportanceLevel } from '../../shared';

// ============ Config Constants ============
export {
  TASK_INSTANCE_GENERATION_CONFIG,
  TASK_INSTANCE_VIEW_CONFIG,
  RECURRENCE_RULE_DEFAULTS,
} from './configs/config';

// ============ Value Objects ============
export type {
  RecurrenceRuleServer,
  RecurrenceRuleServerDTO,
  RecurrenceRulePersistenceDTO,
} from './value-objects/recurrence-rule';

export type {
  RecurrenceRuleClient,
  RecurrenceRuleClientDTO,
} from './value-objects/recurrence-rule-client';

export type {
  TaskReminderConfigServer,
  TaskReminderConfigServerDTO,
  TaskReminderConfigPersistenceDTO,
} from './value-objects/task-reminder-config';

export type {
  TaskReminderConfigClient,
  TaskReminderConfigClientDTO,
} from './value-objects/task-reminder-config-client';

export type {
  TaskGoalBindingServer,
  TaskGoalBindingServerDTO,
  TaskGoalBindingPersistenceDTO,
} from './value-objects/task-goal-binding';

export type {
  TaskGoalBindingClient,
  TaskGoalBindingClientDTO,
} from './value-objects/task-goal-binding-client';

export type {
  TaskTimeConfigServer,
  TaskTimeConfigServerDTO,
  TaskTimeConfigPersistenceDTO,
} from './value-objects/task-time-config';

export type {
  TaskTimeConfigClient,
  TaskTimeConfigClientDTO,
} from './value-objects/task-time-config-client';

export type {
  CompletionRecordServer,
  CompletionRecordServerDTO,
  CompletionRecordPersistenceDTO,
} from './value-objects/completion-record';

export type {
  CompletionRecordClient,
  CompletionRecordClientDTO,
} from './value-objects/completion-record-client';

export type {
  SkipRecordServer,
  SkipRecordServerDTO,
  SkipRecordPersistenceDTO,
} from './value-objects/skip-record-server';

export type { SkipRecordClient, SkipRecordClientDTO } from './value-objects/skip-record-client';

export { PriorityLevel } from './value-objects/task-priority';

export type { TaskPriority, PriorityCalculationParams } from './value-objects/task-priority';

// ============ Entities ============
export type {
  TaskTemplateHistoryServer,
  TaskTemplateHistoryServerDTO,
  TaskTemplateHistoryPersistenceDTO,
} from './entities/task-template-history-server';

export type {
  TaskTemplateHistoryClientDTO,
  TaskTemplateHistoryClient,
} from './entities/task-template-history-client';

// ============ Aggregates ============
export type {
  TaskInstanceServerDTO,
  TaskInstancePersistenceDTO,
  TaskInstanceServer,
} from './aggregates/task-instance-server';

export type {
  TaskInstanceClientDTO,
  TaskInstanceClient,
} from './aggregates/task-instance-client';

export type {
  TaskTemplateServerDTO,
  TaskTemplatePersistenceDTO,
  TaskTemplateServer,
} from './aggregates/task-template-server';

export type {
  TaskTemplateClientDTO,
  TaskTemplateClient,
} from './aggregates/task-template-client';

export type {
  TaskStatisticsServerDTO,
  TaskStatisticsPersistenceDTO,
  TaskStatisticsUpdatedEvent,
  TaskStatisticsRecalculatedEvent,
  TaskStatisticsDomainEvent,
  TaskStatisticsServer,
  TemplateStatsInfo,
  InstanceStatsInfo,
  CompletionStatsInfo,
  TimeStatsInfo,
  DistributionStatsInfo,
} from './aggregates/task-statistics-server';

export type {
  TaskStatisticsClientDTO,
  TaskStatisticsClient,
  ChartData,
  TrendData,
} from './aggregates/task-statistics-client';

export type {
  TaskDependencyServerDTO,
  TaskTemplateWithDependenciesServerDTO,
  CircularDependencyValidationResult,
  DependencyChainServerDTO,
} from './aggregates/task-dependency-server';

export type {
  TaskDependencyClientDTO,
  TaskTemplateWithDependenciesClientDTO,
  DependencyChainClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  BatchCreateDependenciesRequest,
  BatchCreateDependenciesResponse,
} from './aggregates/task-dependency-client';

// ============ Events ============
export type {
  IUnifiedEvent,
  TaskInstanceCompletedEvent,
  TaskTemplateCreatedEvent,
  TaskTemplateDeletedEvent,
  TaskTemplatePausedEvent,
  TaskTemplateResumedEvent,
  TaskTemplateScheduleChangedEvent,
  TaskModuleEvent,
} from './events';

export { TaskEventTypes } from './events';

// ============ API Requests ============
export type {
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  QueryTaskTemplatesRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
  TaskTemplateResponse,
  TaskTemplatesResponse,
  CreateTaskInstanceRequest,
  UpdateTaskInstanceRequest,
  QueryTaskInstancesRequest,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
  TaskInstanceResponse,
  TaskInstancesResponse,
  CheckExpiredInstancesResponse,
  GetDependencyChainRequest,
  TaskDependencyResponse,
  TaskDependenciesResponse,
  DependencyChainResponse,
  GetTaskStatisticsRequest,
  TaskStatisticsResponse,
  RecalculateTaskStatisticsRequest,
  RecalculateTaskStatisticsResponse,
  BatchUpdateTemplateStatusRequest,
  BatchDeleteTemplatesRequest,
  BatchMoveTemplatesRequest,
  BatchCompleteInstancesRequest,
  BatchSkipInstancesRequest,
  BatchDeleteInstancesRequest,
  BatchOperationResponse,
  GetTaskTemplateHistoryRequest,
  TaskTemplateHistoryResponse,
  ExportTaskTemplatesRequest,
  ExportTaskTemplatesResponse,
  ImportTaskTemplatesRequest,
  ImportTaskTemplatesResponse,
  TaskTemplateAggregateViewResponse,
  TaskInstanceAggregateViewResponse,
  TaskStatisticsUpdateEvent,
  CreateOneTimeTaskRequest,
  UpdateOneTimeTaskRequest,
  TaskFiltersRequest,
  TaskDashboardResponse,
  BatchUpdatePriorityRequest,
  BatchCancelTasksRequest,
  LinkTaskToGoalRequest,
} from './api';

// ============ Query Types (Story 2.5) ============
export { TaskSortBy, TaskFilterBy } from './queries';
export type {
  QueryTasksRequest,
  TasksListResponse,
  GetTasksWithPriorityRequest,
  GetTasksWithSortingAndFilteringRequest,
} from './queries';
