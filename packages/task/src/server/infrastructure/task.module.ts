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
} from '../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../domain/repositories/i-task-instance-repository';
import type { ITaskDependencyRepository } from '../domain/repositories/i-task-dependency-repository';
import type { ITaskFolderRepository } from '../domain/repositories/i-task-folder-repository';
import { CreateTaskTemplateUseCase } from '../application/use-cases/commands/create-task-template.use-case';
import { GetTaskTemplateUseCase } from '../application/use-cases/queries/get-task-template.use-case';
import { ListTaskTemplatesUseCase } from '../application/use-cases/queries/list-task-templates.use-case';
import { UpdateTaskTemplateUseCase } from '../application/use-cases/commands/update-task-template.use-case';
import { ActivateTaskTemplateUseCase } from '../application/use-cases/commands/activate-task-template.use-case';
import { PauseTaskTemplateUseCase } from '../application/use-cases/commands/pause-task-template.use-case';
import { ArchiveTaskTemplateUseCase } from '../application/use-cases/commands/archive-task-template.use-case';
import { DeleteTaskTemplateUseCase } from '../application/use-cases/commands/delete-task-template.use-case';
import { CompleteTaskInstanceUseCase } from '../application/use-cases/commands/complete-task-instance.use-case';
import { SkipTaskInstanceUseCase } from '../application/use-cases/commands/skip-task-instance.use-case';
import { GetTaskInstancesByDateRangeUseCase } from '../application/use-cases/queries/get-task-instances-by-date-range.use-case';
import { GetTaskInstanceUseCase } from '../application/use-cases/queries/get-task-instance.use-case';
import { ListTaskInstancesByAccountUseCase } from '../application/use-cases/queries/list-task-instances-by-account.use-case';
import { ListTaskInstancesByTemplateUseCase } from '../application/use-cases/queries/list-task-instances-by-template.use-case';
import { ListTaskInstancesByStatusUseCase } from '../application/use-cases/queries/list-task-instances-by-status.use-case';
import { StartTaskInstanceUseCase } from '../application/use-cases/commands/start-task-instance.use-case';
import { DeleteTaskInstanceUseCase } from '../application/use-cases/commands/delete-task-instance.use-case';
import { GenerateTaskInstancesUseCase } from '../application/use-cases/commands/generate-task-instances.use-case';
import { BindTaskToGoalUseCase } from '../application/use-cases/commands/bind-task-to-goal.use-case';
import { UnbindTaskFromGoalUseCase } from '../application/use-cases/commands/unbind-task-from-goal.use-case';
import { CheckExpiredInstancesUseCase } from '../application/use-cases/commands/check-expired-instances.use-case';
import { CreateTaskDependencyUseCase } from '../application/use-cases/commands/create-task-dependency.use-case';
import { DeleteTaskDependencyUseCase } from '../application/use-cases/commands/delete-task-dependency.use-case';
import { UpdateTaskDependencyUseCase } from '../application/use-cases/commands/update-task-dependency.use-case';
import { ListTaskTemplatesByPriorityUseCase } from '../application/use-cases/queries/list-task-templates-by-priority.use-case';
import { ListTaskDependenciesUseCase } from '../application/use-cases/queries/list-task-dependencies.use-case';
import { GetDependencyChainUseCase } from '../application/use-cases/queries/get-dependency-chain.use-case';
import { ValidateTaskDependencyUseCase } from '../application/use-cases/queries/validate-task-dependency.use-case';
import { GetTaskTemplateGraphUseCase } from '../application/use-cases/queries/get-task-template-graph.use-case';
import type { TaskWriteTransactionRunner } from '../application/use-cases/commands/task-write-support';
import type { TaskApplicationPort } from '../application';

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
  readonly taskWriteTransactionRunner?: TaskWriteTransactionRunner;
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
// 3. Module Instance — the primary return type.
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
// 4. Assembly helpers and factory.
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
  const {
    taskTemplateRepository,
    taskInstanceRepository,
    taskDependencyRepository,
    taskWriteTransactionRunner,
  } = dependencies;
  const listTaskTemplates = new ListTaskTemplatesUseCase(taskTemplateRepository, taskInstanceRepository);

  return {
    // Template commands
    createTaskTemplate: new CreateTaskTemplateUseCase(
      taskTemplateRepository,
      taskInstanceRepository,
      taskWriteTransactionRunner,
    ),
    updateTaskTemplate: new UpdateTaskTemplateUseCase(taskTemplateRepository),
    activateTaskTemplate: new ActivateTaskTemplateUseCase(
      taskTemplateRepository,
      taskInstanceRepository,
      taskWriteTransactionRunner,
    ),
    pauseTaskTemplate: new PauseTaskTemplateUseCase(
      taskTemplateRepository,
      taskInstanceRepository,
      taskWriteTransactionRunner,
    ),
    archiveTaskTemplate: new ArchiveTaskTemplateUseCase(taskTemplateRepository),
    deleteTaskTemplate: new DeleteTaskTemplateUseCase(
      taskTemplateRepository,
      taskInstanceRepository,
      taskWriteTransactionRunner,
    ),
    generateTaskInstances: new GenerateTaskInstancesUseCase(
      taskTemplateRepository,
      taskInstanceRepository,
      taskWriteTransactionRunner,
    ),
    bindTaskToGoal: new BindTaskToGoalUseCase(taskTemplateRepository),
    unbindTaskFromGoal: new UnbindTaskFromGoalUseCase(taskTemplateRepository),

    // Template queries
    getTaskTemplate: new GetTaskTemplateUseCase(taskTemplateRepository, taskInstanceRepository),
    listTaskTemplates,
    getTaskTemplateGraph: new GetTaskTemplateGraphUseCase(listTaskTemplates, taskDependencyRepository),
    listTaskTemplatesByPriority: new ListTaskTemplatesByPriorityUseCase(taskTemplateRepository),

    // Instance commands
    completeTaskInstance: new CompleteTaskInstanceUseCase(
      taskInstanceRepository,
      taskTemplateRepository,
    ),
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
  const api: TaskApplicationPort = {
    createTaskTemplate: (input) => useCases.createTaskTemplate.execute(input),
    updateTaskTemplate: (id, input) => useCases.updateTaskTemplate.execute(id, input),
    activateTaskTemplate: (id) => useCases.activateTaskTemplate.execute(id),
    pauseTaskTemplate: (id) => useCases.pauseTaskTemplate.execute(id),
    archiveTaskTemplate: (id) => useCases.archiveTaskTemplate.execute(id),
    deleteTaskTemplate: (id) => useCases.deleteTaskTemplate.execute(id),
    generateTaskInstances: (id, input) => useCases.generateTaskInstances.execute(id, input),
    bindTaskToGoal: (id, input) => useCases.bindTaskToGoal.execute(id, input),
    unbindTaskFromGoal: (id) => useCases.unbindTaskFromGoal.execute(id),
    getTaskTemplate: (id, includeChildren) => useCases.getTaskTemplate.execute(id, includeChildren),
    listTaskTemplates: (query) => useCases.listTaskTemplates.execute(query),
    getTaskTemplateGraph: (query) => useCases.getTaskTemplateGraph.execute(query),
    listTaskTemplatesByPriority: (identityId, limit) =>
      useCases.listTaskTemplatesByPriority.execute(identityId, limit),
    completeTaskInstance: (id, input) => useCases.completeTaskInstance.execute(id, input),
    skipTaskInstance: (id, input) => useCases.skipTaskInstance.execute(id, input),
    startTaskInstance: (id) => useCases.startTaskInstance.execute(id),
    deleteTaskInstance: (id) => useCases.deleteTaskInstance.execute(id),
    checkExpiredInstances: (identityId) => useCases.checkExpiredInstances.execute(identityId),
    getTaskInstance: (id) => useCases.getTaskInstance.execute(id),
    listTaskInstancesByAccount: (identityId) =>
      useCases.listTaskInstancesByAccount.execute(identityId),
    listTaskInstancesByTemplate: (templateId) =>
      useCases.listTaskInstancesByTemplate.execute(templateId),
    listTaskInstancesByStatus: (identityId, status) =>
      useCases.listTaskInstancesByStatus.execute(identityId, status),
    getTaskInstancesByDateRange: (identityId, startDate, endDate) =>
      useCases.getTaskInstancesByDateRange.execute(identityId, startDate, endDate),
    createTaskDependency: (input) => useCases.createTaskDependency.execute(input),
    deleteTaskDependency: (id) => useCases.deleteTaskDependency.execute(id),
    updateTaskDependency: (id, input) => useCases.updateTaskDependency.execute(id, input),
    listTaskDependencies: (taskId) => useCases.listTaskDependencies.executeDependencies(taskId),
    listTaskDependents: (taskId) => useCases.listTaskDependencies.executeDependents(taskId),
    getDependencyChain: (taskId) => useCases.getDependencyChain.execute(taskId),
    validateTaskDependency: (predecessorTaskId, successorTaskId) =>
      useCases.validateTaskDependency.execute(predecessorTaskId, successorTaskId),
  };

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






