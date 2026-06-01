/**
 * createTaskModule — explicit composition root for the task server runtime.
 * createTaskModule —— 任务模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Task uses this file as the package's "living documentation" example for
 * the target monorepo pattern: one composition root per module, constructor
 * injection only, no hidden service locator.
 */

import type {
  ITaskTemplateRepository,
} from '../domain-server/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../domain-server/repositories/i-task-instance-repository';
import type { ITaskDependencyRepository } from '../domain-server/repositories/i-task-dependency-repository';
import type { ITaskFolderRepository } from '../domain-server/repositories/i-task-folder-repository';
import { CreateTaskTemplateUseCase } from '../application-server/use-cases/commands/create-task-template.use-case';
import { GetTaskTemplateUseCase } from '../application-server/use-cases/queries/get-task-template.use-case';
import { ListTaskTemplatesUseCase } from '../application-server/use-cases/queries/list-task-templates.use-case';
import { UpdateTaskTemplateUseCase } from '../application-server/use-cases/commands/update-task-template.use-case';
import { ActivateTaskTemplateUseCase } from '../application-server/use-cases/commands/activate-task-template.use-case';
import { PauseTaskTemplateUseCase } from '../application-server/use-cases/commands/pause-task-template.use-case';
import { ArchiveTaskTemplateUseCase } from '../application-server/use-cases/commands/archive-task-template.use-case';
import { DeleteTaskTemplateUseCase } from '../application-server/use-cases/commands/delete-task-template.use-case';
import { CompleteTaskInstanceUseCase } from '../application-server/use-cases/commands/complete-task-instance.use-case';
import { SkipTaskInstanceUseCase } from '../application-server/use-cases/commands/skip-task-instance.use-case';
import { GetTaskInstancesByDateRangeUseCase } from '../application-server/use-cases/queries/get-task-instances-by-date-range.use-case';
import { GetTaskInstanceUseCase } from '../application-server/use-cases/queries/get-task-instance.use-case';
import { ListTaskInstancesByAccountUseCase } from '../application-server/use-cases/queries/list-task-instances-by-account.use-case';
import { ListTaskInstancesByTemplateUseCase } from '../application-server/use-cases/queries/list-task-instances-by-template.use-case';
import { ListTaskInstancesByStatusUseCase } from '../application-server/use-cases/queries/list-task-instances-by-status.use-case';
import { StartTaskInstanceUseCase } from '../application-server/use-cases/commands/start-task-instance.use-case';
import { DeleteTaskInstanceUseCase } from '../application-server/use-cases/commands/delete-task-instance.use-case';
import { GenerateTaskInstancesUseCase } from '../application-server/use-cases/commands/generate-task-instances.use-case';
import { BindTaskToGoalUseCase } from '../application-server/use-cases/commands/bind-task-to-goal.use-case';
import { UnbindTaskFromGoalUseCase } from '../application-server/use-cases/commands/unbind-task-from-goal.use-case';
import { CheckExpiredInstancesUseCase } from '../application-server/use-cases/commands/check-expired-instances.use-case';
import { CreateTaskDependencyUseCase } from '../application-server/use-cases/commands/create-task-dependency.use-case';
import { DeleteTaskDependencyUseCase } from '../application-server/use-cases/commands/delete-task-dependency.use-case';
import { UpdateTaskDependencyUseCase } from '../application-server/use-cases/commands/update-task-dependency.use-case';
import { ListTaskTemplatesByPriorityUseCase } from '../application-server/use-cases/queries/list-task-templates-by-priority.use-case';
import { ListTaskDependenciesUseCase } from '../application-server/use-cases/queries/list-task-dependencies.use-case';
import { GetDependencyChainUseCase } from '../application-server/use-cases/queries/get-dependency-chain.use-case';
import { ValidateTaskDependencyUseCase } from '../application-server/use-cases/queries/validate-task-dependency.use-case';
import { GetTaskTemplateGraphUseCase } from '../application-server/use-cases/queries/get-task-template-graph.use-case';

// ---------------------------------------------------------------------------
// 1. Dependencies — everything the task server runtime needs from the outside.
//    依赖 — 任务模块服务端运行时向外部索取的全部依赖。
// ---------------------------------------------------------------------------

/**
 * Optional runtime side effects the module owns.
 * 模块拥有的可选运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This replaces the older global InitializationManager registration.
 */
export interface TaskModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export type TaskRuntimeContributionsInput =
  | TaskModuleRuntimeContribution
  | readonly TaskModuleRuntimeContribution[];

/**
 * Everything the task server runtime needs from the outside world.
 * 任务模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 */
export interface TaskModuleDependencies {
  readonly taskTemplateRepository: ITaskTemplateRepository;
  readonly taskInstanceRepository: ITaskInstanceRepository;
  readonly taskDependencyRepository: ITaskDependencyRepository;
  readonly taskFolderRepository?: ITaskFolderRepository;
  readonly runtimeContributions?: TaskRuntimeContributionsInput;
}

// ---------------------------------------------------------------------------
// 2. Use Cases — lower-level assembled use case collection.
//    已完成接线的底层 use case 集合。
// ---------------------------------------------------------------------------

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `TaskApplicationPort`.
 */
export interface TaskModuleUseCases {
  // Template commands
  readonly createTaskTemplate: CreateTaskTemplateUseCase;
  readonly updateTaskTemplate: UpdateTaskTemplateUseCase;
  readonly activateTaskTemplate: ActivateTaskTemplateUseCase;
  readonly pauseTaskTemplate: PauseTaskTemplateUseCase;
  readonly archiveTaskTemplate: ArchiveTaskTemplateUseCase;
  readonly deleteTaskTemplate: DeleteTaskTemplateUseCase;
  readonly generateTaskInstances: GenerateTaskInstancesUseCase;
  readonly bindTaskToGoal: BindTaskToGoalUseCase;
  readonly unbindTaskFromGoal: UnbindTaskFromGoalUseCase;

  // Template queries
  readonly getTaskTemplate: GetTaskTemplateUseCase;
  readonly listTaskTemplates: ListTaskTemplatesUseCase;
  readonly getTaskTemplateGraph: GetTaskTemplateGraphUseCase;
  readonly listTaskTemplatesByPriority: ListTaskTemplatesByPriorityUseCase;

  // Instance commands
  readonly completeTaskInstance: CompleteTaskInstanceUseCase;
  readonly skipTaskInstance: SkipTaskInstanceUseCase;
  readonly startTaskInstance: StartTaskInstanceUseCase;
  readonly deleteTaskInstance: DeleteTaskInstanceUseCase;
  readonly checkExpiredInstances: CheckExpiredInstancesUseCase;

  // Instance queries
  readonly getTaskInstance: GetTaskInstanceUseCase;
  readonly listTaskInstancesByAccount: ListTaskInstancesByAccountUseCase;
  readonly listTaskInstancesByTemplate: ListTaskInstancesByTemplateUseCase;
  readonly listTaskInstancesByStatus: ListTaskInstancesByStatusUseCase;
  readonly getTaskInstancesByDateRange: GetTaskInstancesByDateRangeUseCase;

  // Dependency commands
  readonly createTaskDependency: CreateTaskDependencyUseCase;
  readonly deleteTaskDependency: DeleteTaskDependencyUseCase;
  readonly updateTaskDependency: UpdateTaskDependencyUseCase;

  // Dependency queries
  readonly listTaskDependencies: ListTaskDependenciesUseCase;
  readonly getDependencyChain: GetDependencyChainUseCase;
  readonly validateTaskDependency: ValidateTaskDependencyUseCase;
}

// ---------------------------------------------------------------------------
// 3. Application Port — transport-neutral callable surface.
//    传输层无关的可调用应用层门面。
// ---------------------------------------------------------------------------

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface TaskApplicationPort {
  // Template commands
  createTaskTemplate: CreateTaskTemplateUseCase;
  updateTaskTemplate: UpdateTaskTemplateUseCase;
  activateTaskTemplate: ActivateTaskTemplateUseCase;
  pauseTaskTemplate: PauseTaskTemplateUseCase;
  archiveTaskTemplate: ArchiveTaskTemplateUseCase;
  deleteTaskTemplate: DeleteTaskTemplateUseCase;
  generateTaskInstances: GenerateTaskInstancesUseCase;
  bindTaskToGoal: BindTaskToGoalUseCase;
  unbindTaskFromGoal: UnbindTaskFromGoalUseCase;

  // Template queries
  getTaskTemplate: GetTaskTemplateUseCase;
  listTaskTemplates: ListTaskTemplatesUseCase;
  getTaskTemplateGraph: GetTaskTemplateGraphUseCase;
  listTaskTemplatesByPriority: ListTaskTemplatesByPriorityUseCase;

  // Instance commands
  completeTaskInstance: CompleteTaskInstanceUseCase;
  skipTaskInstance: SkipTaskInstanceUseCase;
  startTaskInstance: StartTaskInstanceUseCase;
  deleteTaskInstance: DeleteTaskInstanceUseCase;
  checkExpiredInstances: CheckExpiredInstancesUseCase;

  // Instance queries
  getTaskInstance: GetTaskInstanceUseCase;
  listTaskInstancesByAccount: ListTaskInstancesByAccountUseCase;
  listTaskInstancesByTemplate: ListTaskInstancesByTemplateUseCase;
  listTaskInstancesByStatus: ListTaskInstancesByStatusUseCase;
  getTaskInstancesByDateRange: GetTaskInstancesByDateRangeUseCase;

  // Dependency commands
  createTaskDependency: CreateTaskDependencyUseCase;
  deleteTaskDependency: DeleteTaskDependencyUseCase;
  updateTaskDependency: UpdateTaskDependencyUseCase;

  // Dependency queries
  listTaskDependencies: ListTaskDependenciesUseCase;
  getDependencyChain: GetDependencyChainUseCase;
  validateTaskDependency: ValidateTaskDependencyUseCase;
}

// ---------------------------------------------------------------------------
// 4. Module Instance — the primary return type.
//    模块实例 — 主组合根返回类型。
// ---------------------------------------------------------------------------

/**
 * Primary task composition root return type.
 * 任务模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `start` / `dispose` own runtime side effects.
 */
export interface TaskModuleInstance {
  readonly taskTemplateRepository: ITaskTemplateRepository;
  readonly taskInstanceRepository: ITaskInstanceRepository;
  readonly taskDependencyRepository: ITaskDependencyRepository;
  readonly taskFolderRepository?: ITaskFolderRepository;
  readonly useCases: TaskModuleUseCases;
  readonly api: TaskApplicationPort;
  start(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// 5. Assembly helpers and factory.
//    组装函数和工厂。
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  runtimeContributions?: TaskRuntimeContributionsInput,
): readonly TaskModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as TaskModuleRuntimeContribution];
}

/**
 * Pure assembly helper used by the factory and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
export function createTaskUseCases(dependencies: TaskModuleDependencies): TaskModuleUseCases {
  const { taskTemplateRepository, taskInstanceRepository, taskDependencyRepository } = dependencies;
  const listTaskTemplates = new ListTaskTemplatesUseCase(taskTemplateRepository, taskInstanceRepository);

  return {
    // Template commands
    createTaskTemplate: new CreateTaskTemplateUseCase(taskTemplateRepository, taskInstanceRepository),
    updateTaskTemplate: new UpdateTaskTemplateUseCase(taskTemplateRepository),
    activateTaskTemplate: new ActivateTaskTemplateUseCase(taskTemplateRepository, taskInstanceRepository),
    pauseTaskTemplate: new PauseTaskTemplateUseCase(taskTemplateRepository, taskInstanceRepository),
    archiveTaskTemplate: new ArchiveTaskTemplateUseCase(taskTemplateRepository),
    deleteTaskTemplate: new DeleteTaskTemplateUseCase(taskTemplateRepository, taskInstanceRepository),
    generateTaskInstances: new GenerateTaskInstancesUseCase(
      taskTemplateRepository,
      taskInstanceRepository,
    ),
    bindTaskToGoal: new BindTaskToGoalUseCase(taskTemplateRepository),
    unbindTaskFromGoal: new UnbindTaskFromGoalUseCase(taskTemplateRepository),

    // Template queries
    getTaskTemplate: new GetTaskTemplateUseCase(taskTemplateRepository, taskInstanceRepository),
    listTaskTemplates,
    getTaskTemplateGraph: new GetTaskTemplateGraphUseCase(listTaskTemplates, taskDependencyRepository),
    listTaskTemplatesByPriority: new ListTaskTemplatesByPriorityUseCase(taskTemplateRepository),

    // Instance commands
    completeTaskInstance: new CompleteTaskInstanceUseCase(taskInstanceRepository),
    skipTaskInstance: new SkipTaskInstanceUseCase(taskInstanceRepository),
    startTaskInstance: new StartTaskInstanceUseCase(taskInstanceRepository),
    deleteTaskInstance: new DeleteTaskInstanceUseCase(taskInstanceRepository),
    checkExpiredInstances: new CheckExpiredInstancesUseCase(taskInstanceRepository),

    // Instance queries
    getTaskInstance: new GetTaskInstanceUseCase(taskInstanceRepository),
    listTaskInstancesByAccount: new ListTaskInstancesByAccountUseCase(taskInstanceRepository),
    listTaskInstancesByTemplate: new ListTaskInstancesByTemplateUseCase(taskInstanceRepository),
    listTaskInstancesByStatus: new ListTaskInstancesByStatusUseCase(taskInstanceRepository),
    getTaskInstancesByDateRange: new GetTaskInstancesByDateRangeUseCase(taskInstanceRepository),

    // Dependency commands
    createTaskDependency: new CreateTaskDependencyUseCase(taskDependencyRepository),
    deleteTaskDependency: new DeleteTaskDependencyUseCase(taskDependencyRepository),
    updateTaskDependency: new UpdateTaskDependencyUseCase(taskDependencyRepository),

    // Dependency queries
    listTaskDependencies: new ListTaskDependenciesUseCase(taskDependencyRepository),
    getDependencyChain: new GetDependencyChainUseCase(taskDependencyRepository),
    validateTaskDependency: new ValidateTaskDependencyUseCase(taskDependencyRepository),
  };
}

/**
 * Canonical composition root.
 * 规范化的任务模块主组合根。
 *
 * This is the file other modules should copy first when migrating away from a
 * container-based assembly. The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api`
 * 5. let the module instance own `start` / `dispose`
 */
export function createTaskModule(dependencies: TaskModuleDependencies): TaskModuleInstance {
  const {
    taskTemplateRepository,
    taskInstanceRepository,
    taskDependencyRepository,
    taskFolderRepository,
  } = dependencies;

  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createTaskUseCases(dependencies);
  let started = false;

  // The API facade simply exposes the assembled use cases.
  // API 门面只是直接暴露已组装好的 use case。
  const api: TaskApplicationPort = { ...useCases };

  return {
    taskTemplateRepository,
    taskInstanceRepository,
    taskDependencyRepository,
    taskFolderRepository,
    useCases,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
