/**
 * Task Application Module (Client)
 *
 * Re-exports all task-related application services.
 */

// ============================================================
// Smart Container (Single Source of Truth)
// ============================================================
export { TaskApplicationService, taskApplicationService } from './task-application.service';

export { TaskContainer } from '@dailyuse/infrastructure-client';

export {
  // Types
  type TaskForDAG,
  type TaskForWidget,
  taskTemplateToDAG,
  taskInstanceToDAG,
  taskInstanceToWidget,

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

  // Integration Services
  TaskInstanceSyncService,
  taskInstanceSyncService,
  TaskScheduleIntegrationService,
  taskScheduleIntegrationService,
  type TaskScheduleConfig,
  type TaskInfo,

  // Utility Services for DAG and dependency management
  TaskAutoStatusService,
  taskAutoStatusService,
  type TaskStatus,
  type StatusUpdateResult,
  type TaskReadinessAnalysis,
  TaskCriticalPathService,
  taskCriticalPathService,
  type TaskTiming,
  type CriticalPathResult,
  type OptimizationSuggestion,
  type ProjectTimeline,
  SuggestionType,
  type DependencyCreationResult,
  TaskDependencyDragDropService,
  type GraphNode,
  type GraphEdge,
  type TaskGraph,
  TaskDependencyGraphService,
  type ValidationResult,
  type ValidationError,
  TaskDependencyValidationService,

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
