/**
 * Task Application Module (Client)
 *
 * Re-exports all task-related application services.
 */

export { TaskContainer } from '@dailyuse/infrastructure-client';

export {
  // Events
  TaskEvents,
  TaskInstanceEvents,
  TaskDependencyEvents,
  type TaskDependencyRefreshEvent,
  
  // Task Template Use Cases
  CreateTaskTemplate,
  ListTaskTemplates,
  GetTaskTemplate,
  UpdateTaskTemplate,
  DeleteTaskTemplate,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  ArchiveTaskTemplate,
  GenerateTaskInstances,
  GetInstancesByDateRange,
  BindTaskToGoal,
  UnbindTaskFromGoal,
  
  // Task Instance Use Cases
  ListTaskInstances,
  GetTaskInstance,
  DeleteTaskInstance,
  StartTaskInstance,
  CompleteTaskInstance,
  SkipTaskInstance,
  CheckExpiredInstances,
  
  // Task Dependency Use Cases
  CreateTaskDependency,
  GetTaskDependencies,
  GetTaskDependents,
  GetDependencyChain,
  ValidateTaskDependency,
  UpdateTaskDependency,
  DeleteTaskDependency,
  
  // Task Statistics Use Cases
  GetTaskStatistics,
  RecalculateTaskStatistics,
  DeleteTaskStatistics,
  UpdateTemplateStats,
  UpdateInstanceStats,
  UpdateCompletionStats,
  GetTodayCompletionRate,
  GetWeekCompletionRate,
  GetEfficiencyTrend,
  
  // Legacy exports (deprecated)
  TaskTemplateApplicationService,
  createTaskTemplateService,
  type TaskTemplateRefreshEvent,
  TaskInstanceApplicationService,
  createTaskInstanceService,
  type TaskInstanceRefreshEvent,
  TaskDependencyApplicationService,
  createTaskDependencyService,
  TaskStatisticsApplicationService,
  createTaskStatisticsService,
} from './services';
