import type { ActivateTaskTemplateUseCase } from './use-cases/commands/activate-task-template.use-case';
import type { ArchiveTaskTemplateUseCase } from './use-cases/commands/archive-task-template.use-case';
import type { AbandonTaskPlanUseCase } from './use-cases/commands/abandon-task-plan.use-case';
import type { BindTaskToGoalUseCase } from './use-cases/commands/bind-task-to-goal.use-case';
import type { MarkTaskInstanceMissedUseCase } from './use-cases/commands/mark-task-instance-missed.use-case';
import type { RescheduleTaskInstanceUseCase } from './use-cases/commands/reschedule-task-instance.use-case';
import type { CompleteTaskInstanceUseCase } from './use-cases/commands/complete-task-instance.use-case';
import type { UncompleteTaskInstanceUseCase } from './use-cases/commands/uncomplete-task-instance.use-case';
import type { CreateTaskTemplateUseCase } from './use-cases/commands/create-task-template.use-case';
import type { DeleteTaskInstanceUseCase } from './use-cases/commands/delete-task-instance.use-case';
import type { DeleteTaskTemplateUseCase } from './use-cases/commands/delete-task-template.use-case';
import type { GenerateTaskInstancesUseCase } from './use-cases/commands/generate-task-instances.use-case';
import type { PauseTaskTemplateUseCase } from './use-cases/commands/pause-task-template.use-case';
import type { SkipTaskInstanceUseCase } from './use-cases/commands/skip-task-instance.use-case';
import type { StartTaskInstanceUseCase } from './use-cases/commands/start-task-instance.use-case';
import type { UnbindTaskFromGoalUseCase } from './use-cases/commands/unbind-task-from-goal.use-case';
import type { UpdateTaskTemplateUseCase } from './use-cases/commands/update-task-template.use-case';
import type { GetTaskInstanceUseCase } from './use-cases/queries/get-task-instance.use-case';
import type { GetTaskInstancesByDateRangeUseCase } from './use-cases/queries/get-task-instances-by-date-range.use-case';
import type { GetTaskTemplateUseCase } from './use-cases/queries/get-task-template.use-case';
import type { ListTaskInstancesByAccountUseCase } from './use-cases/queries/list-task-instances-by-account.use-case';
import type { ListTaskInstancesByStatusUseCase } from './use-cases/queries/list-task-instances-by-status.use-case';
import type { ListTaskInstancesByTemplateUseCase } from './use-cases/queries/list-task-instances-by-template.use-case';
import type { ListTaskTemplatesUseCase } from './use-cases/queries/list-task-templates.use-case';

type TaskPortFn<T extends (...args: never[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T>;

/** Transport-neutral callable application surface. */
export interface TaskApplicationPort {
  // Template commands
  createTaskTemplate: TaskPortFn<CreateTaskTemplateUseCase['execute']>;
  updateTaskTemplate: TaskPortFn<UpdateTaskTemplateUseCase['execute']>;
  activateTaskTemplate: TaskPortFn<ActivateTaskTemplateUseCase['execute']>;
  pauseTaskTemplate: TaskPortFn<PauseTaskTemplateUseCase['execute']>;
  archiveTaskTemplate: TaskPortFn<ArchiveTaskTemplateUseCase['execute']>;
  abandonTaskPlan: TaskPortFn<AbandonTaskPlanUseCase['execute']>;
  deleteTaskTemplate: TaskPortFn<DeleteTaskTemplateUseCase['execute']>;
  generateTaskInstances: TaskPortFn<GenerateTaskInstancesUseCase['execute']>;
  bindTaskToGoal: TaskPortFn<BindTaskToGoalUseCase['execute']>;
  unbindTaskFromGoal: TaskPortFn<UnbindTaskFromGoalUseCase['execute']>;

  // Template queries
  getTaskTemplate: TaskPortFn<GetTaskTemplateUseCase['execute']>;
  listTaskTemplates: TaskPortFn<ListTaskTemplatesUseCase['execute']>;

  // Instance commands
  completeTaskInstance: TaskPortFn<CompleteTaskInstanceUseCase['execute']>;
  uncompleteTaskInstance: TaskPortFn<UncompleteTaskInstanceUseCase['execute']>;
  skipTaskInstance: TaskPortFn<SkipTaskInstanceUseCase['execute']>;
  markTaskInstanceMissed: TaskPortFn<MarkTaskInstanceMissedUseCase['execute']>;
  startTaskInstance: TaskPortFn<StartTaskInstanceUseCase['execute']>;
  deleteTaskInstance: TaskPortFn<DeleteTaskInstanceUseCase['execute']>;
  rescheduleTaskInstance: TaskPortFn<RescheduleTaskInstanceUseCase['execute']>;

  // Instance queries
  getTaskInstance: TaskPortFn<GetTaskInstanceUseCase['execute']>;
  listTaskInstancesByAccount: TaskPortFn<ListTaskInstancesByAccountUseCase['execute']>;
  listTaskInstancesByTemplate: TaskPortFn<ListTaskInstancesByTemplateUseCase['execute']>;
  listTaskInstancesByStatus: TaskPortFn<ListTaskInstancesByStatusUseCase['execute']>;
  getTaskInstancesByDateRange: TaskPortFn<GetTaskInstancesByDateRangeUseCase['execute']>;
}
