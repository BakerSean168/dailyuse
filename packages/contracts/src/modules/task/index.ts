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
} from './config';

// ============ Value Objects ============
export type {
  RecurrenceRuleServer,
  RecurrenceRuleServerDTO,
  RecurrenceRulePersistenceDTO,
} from './value-objects/RecurrenceRuleServer';

export type {
  RecurrenceRuleClient,
  RecurrenceRuleClientDTO,
} from './value-objects/RecurrenceRuleClient';

export type {
  TaskReminderConfigServer,
  TaskReminderConfigServerDTO,
  TaskReminderConfigPersistenceDTO,
} from './value-objects/TaskReminderConfigServer';

export type {
  TaskReminderConfigClient,
  TaskReminderConfigClientDTO,
} from './value-objects/TaskReminderConfigClient';

export type {
  TaskGoalBindingServer,
  TaskGoalBindingServerDTO,
  TaskGoalBindingPersistenceDTO,
} from './value-objects/TaskGoalBindingServer';

export type {
  TaskGoalBindingClient,
  TaskGoalBindingClientDTO,
} from './value-objects/TaskGoalBindingClient';

export type {
  TaskTimeConfigServer,
  TaskTimeConfigServerDTO,
  TaskTimeConfigPersistenceDTO,
} from './value-objects/TaskTimeConfigServer';

export type {
  TaskTimeConfigClient,
  TaskTimeConfigClientDTO,
} from './value-objects/TaskTimeConfigClient';

export type {
  CompletionRecordServer,
  CompletionRecordServerDTO,
  CompletionRecordPersistenceDTO,
} from './value-objects/CompletionRecordServer';

export type {
  CompletionRecordClient,
  CompletionRecordClientDTO,
} from './value-objects/CompletionRecordClient';

export type {
  SkipRecordServer,
  SkipRecordServerDTO,
  SkipRecordPersistenceDTO,
} from './value-objects/SkipRecordServer';

export type { SkipRecordClient, SkipRecordClientDTO } from './value-objects/SkipRecordClient';

export { PriorityLevel } from './value-objects/TaskPriority';

export type { TaskPriority, PriorityCalculationParams } from './value-objects/TaskPriority';

// ============ Entities ============
export type {
  TaskTemplateHistoryServer,
  TaskTemplateHistoryServerDTO,
  TaskTemplateHistoryPersistenceDTO,
} from './entities/TaskTemplateHistoryServer';

export type {
  TaskTemplateHistoryClientDTO,
  TaskTemplateHistoryClient,  TaskTemplateHistoryClientInstance,
} from './entities/TaskTemplateHistoryClient';

// ============ Aggregates ============
export type {
  TaskInstanceServerDTO,
  TaskInstancePersistenceDTO,
  TaskInstanceServer,
} from './aggregates/TaskInstanceServer';

export type {
  TaskInstanceClientDTO,
  TaskInstanceClient,  TaskInstanceClientInstance,
} from './aggregates/TaskInstanceClient';

export type {
  TaskTemplateServerDTO,
  TaskTemplatePersistenceDTO,
  TaskTemplateServer,
} from './aggregates/TaskTemplateServer';

export type {
  TaskTemplateClientDTO,
  TaskTemplateClient,  TaskTemplateClientInstance,
} from './aggregates/TaskTemplateClient';

export type {
  TaskStatisticsServerDTO,
  TaskStatisticsPersistenceDTO,
  TaskStatisticsUpdatedEvent,
  TaskStatisticsRecalculatedEvent,
  TaskStatisticsDomainEvent,
  TaskStatisticsServer,  TemplateStatsInfo,
  InstanceStatsInfo,
  CompletionStatsInfo,
  TimeStatsInfo,
  DistributionStatsInfo,
} from './aggregates/TaskStatisticsServer';

export type {
  TaskStatisticsClientDTO,
  TaskStatisticsClient,  ChartData,
  TrendData,
} from './aggregates/TaskStatisticsClient';

export type {
  TaskDependencyServerDTO,
  TaskTemplateWithDependenciesServerDTO,
  CircularDependencyValidationResult,
  DependencyChainServerDTO,
} from './aggregates/TaskDependencyServer';

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
} from './aggregates/TaskDependencyClient';

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
} from './api-requests';

// ============ Query Types (Story 2.5) ============
export { TaskSortBy, TaskFilterBy } from './queries';
export type {
  QueryTasksRequest,
  TasksListResponse,
  GetTasksWithPriorityRequest,
  GetTasksWithSortingAndFilteringRequest,
} from './queries';
