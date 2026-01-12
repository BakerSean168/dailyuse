/**
 * Task Application Services
 *
 * Named exports for all task-related application services.
 */

// Container
export { TaskContainer } from '@dailyuse/infrastructure-client';

// Events
export { TaskEvents, TaskInstanceEvents } from './task-events';
export {
  TaskDependencyEvents,
  type TaskDependencyRefreshEvent,
} from './task-dependency-events';

// Task Template Use Cases
export { CreateTaskTemplate } from './create-task-template';
export { ListTaskTemplates } from './list-task-templates';
export { GetTaskTemplate } from './get-task-template';
export { UpdateTaskTemplate } from './update-task-template';
export { DeleteTaskTemplate } from './delete-task-template';
export { ActivateTaskTemplate } from './activate-task-template';
export { PauseTaskTemplate } from './pause-task-template';
export { ArchiveTaskTemplate } from './archive-task-template';
export { GenerateTaskInstances } from './generate-task-instances';
export { GetInstancesByDateRange } from './get-instances-by-date-range';
export { BindTaskToGoal } from './bind-task-to-goal';
export { UnbindTaskFromGoal } from './unbind-task-from-goal';

// Task Instance Use Cases
export { ListTaskInstances } from './list-task-instances';
export { GetTaskInstance } from './get-task-instance';
export { DeleteTaskInstance } from './delete-task-instance';
export { StartTaskInstance } from './start-task-instance';
export { CompleteTaskInstance } from './complete-task-instance';
export { SkipTaskInstance } from './skip-task-instance';
export { CheckExpiredInstances } from './check-expired-instances';

// Task Dependency Use Cases
export { CreateTaskDependency } from './create-task-dependency';
export { GetTaskDependencies } from './get-task-dependencies';
export { GetTaskDependents } from './get-task-dependents';
export { GetDependencyChain } from './get-dependency-chain';
export { ValidateTaskDependency } from './validate-task-dependency';
export { UpdateTaskDependency } from './update-task-dependency';
export { DeleteTaskDependency } from './delete-task-dependency';

// Task Statistics Use Cases
export { GetTaskStatistics } from './get-task-statistics';
export { RecalculateTaskStatistics } from './recalculate-task-statistics';
export { DeleteTaskStatistics } from './delete-task-statistics';
export { UpdateTemplateStats } from './update-template-stats';
export { UpdateInstanceStats } from './update-instance-stats';
export { UpdateCompletionStats } from './update-completion-stats';
export { GetTodayCompletionRate } from './get-today-completion-rate';
export { GetWeekCompletionRate } from './get-week-completion-rate';
export { GetEfficiencyTrend } from './get-efficiency-trend';

// Legacy exports for backward compatibility (deprecated)
export {
  TaskTemplateApplicationService,
  createTaskTemplateService,
  type TaskTemplateRefreshEvent,
} from './TaskTemplateApplicationService';

export {
  TaskInstanceApplicationService,
  createTaskInstanceService,
  type TaskInstanceRefreshEvent,
} from './TaskInstanceApplicationService';

export {
  TaskDependencyApplicationService,
  createTaskDependencyService,
} from './TaskDependencyApplicationService';

export {
  TaskStatisticsApplicationService,
  createTaskStatisticsService,
} from './TaskStatisticsApplicationService';
