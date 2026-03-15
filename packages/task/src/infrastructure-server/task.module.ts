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

import type { Result } from '@dailyuse/contracts/result';
import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskDependencyRepository } from '../domain-server/repositories/ITaskDependencyRepository';
import type { ITaskFolderRepository } from '../domain-server/repositories/ITaskFolderRepository';
import type {
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
  QueryTaskTemplatesReq,
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskDependencyServerDTO,
  DependencyChainServerDTO,
  DependencyType,
} from '@dailyuse/contracts/task';
import { CreateTaskTemplate } from '../application-server/use-cases/commands/create-task-template';
import { GetTaskTemplate } from '../application-server/use-cases/queries/get-task-template';
import { ListTaskTemplates } from '../application-server/use-cases/queries/list-task-templates';
import { UpdateTaskTemplate } from '../application-server/use-cases/commands/update-task-template';
import { ActivateTaskTemplate } from '../application-server/use-cases/commands/activate-task-template';
import { PauseTaskTemplate } from '../application-server/use-cases/commands/pause-task-template';
import { ArchiveTaskTemplate } from '../application-server/use-cases/commands/archive-task-template';
import { DeleteTaskTemplate } from '../application-server/use-cases/commands/delete-task-template';
import { CompleteTaskInstance } from '../application-server/use-cases/commands/complete-task-instance';
import { SkipTaskInstance } from '../application-server/use-cases/commands/skip-task-instance';
import { GetTaskInstancesByDateRange } from '../application-server/use-cases/queries/get-task-instances-by-date-range';
import { GetTaskInstance } from '../application-server/use-cases/queries/get-task-instance';
import { ListTaskInstancesByAccount } from '../application-server/use-cases/queries/list-task-instances-by-account';
import { ListTaskInstancesByTemplate } from '../application-server/use-cases/queries/list-task-instances-by-template';
import { ListTaskInstancesByStatus } from '../application-server/use-cases/queries/list-task-instances-by-status';
import { StartTaskInstance } from '../application-server/use-cases/commands/start-task-instance';
import { DeleteTaskInstance } from '../application-server/use-cases/commands/delete-task-instance';
import { GenerateTaskInstances } from '../application-server/use-cases/commands/generate-task-instances';
import { BindTaskToGoal } from '../application-server/use-cases/commands/bind-task-to-goal';
import { UnbindTaskFromGoal } from '../application-server/use-cases/commands/unbind-task-from-goal';
import { CheckExpiredInstances } from '../application-server/use-cases/commands/check-expired-instances';
import { CreateTaskDependency } from '../application-server/use-cases/commands/create-task-dependency';
import { DeleteTaskDependency } from '../application-server/use-cases/commands/delete-task-dependency';
import { UpdateTaskDependency } from '../application-server/use-cases/commands/update-task-dependency';
import { ListTaskTemplatesByPriority } from '../application-server/use-cases/queries/list-task-templates-by-priority';
import { ListTaskDependencies } from '../application-server/use-cases/queries/list-task-dependencies';
import { GetDependencyChain } from '../application-server/use-cases/queries/get-dependency-chain';
import { ValidateTaskDependency } from '../application-server/use-cases/queries/validate-task-dependency';

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
  readonly createTaskTemplate: CreateTaskTemplate;
  readonly updateTaskTemplate: UpdateTaskTemplate;
  readonly activateTaskTemplate: ActivateTaskTemplate;
  readonly pauseTaskTemplate: PauseTaskTemplate;
  readonly archiveTaskTemplate: ArchiveTaskTemplate;
  readonly deleteTaskTemplate: DeleteTaskTemplate;
  readonly generateTaskInstances: GenerateTaskInstances;
  readonly bindTaskToGoal: BindTaskToGoal;
  readonly unbindTaskFromGoal: UnbindTaskFromGoal;

  // Template queries
  readonly getTaskTemplate: GetTaskTemplate;
  readonly listTaskTemplates: ListTaskTemplates;
  readonly listTaskTemplatesByPriority: ListTaskTemplatesByPriority;

  // Instance commands
  readonly completeTaskInstance: CompleteTaskInstance;
  readonly skipTaskInstance: SkipTaskInstance;
  readonly startTaskInstance: StartTaskInstance;
  readonly deleteTaskInstance: DeleteTaskInstance;
  readonly checkExpiredInstances: CheckExpiredInstances;

  // Instance queries
  readonly getTaskInstance: GetTaskInstance;
  readonly listTaskInstancesByAccount: ListTaskInstancesByAccount;
  readonly listTaskInstancesByTemplate: ListTaskInstancesByTemplate;
  readonly listTaskInstancesByStatus: ListTaskInstancesByStatus;
  readonly getTaskInstancesByDateRange: GetTaskInstancesByDateRange;

  // Dependency commands
  readonly createTaskDependency: CreateTaskDependency;
  readonly deleteTaskDependency: DeleteTaskDependency;
  readonly updateTaskDependency: UpdateTaskDependency;

  // Dependency queries
  readonly listTaskDependencies: ListTaskDependencies;
  readonly getDependencyChain: GetDependencyChain;
  readonly validateTaskDependency: ValidateTaskDependency;
}

// ---------------------------------------------------------------------------
// 3. Application Port — transport-neutral callable surface.
//    传输层无关的可调用应用层门面。
// ---------------------------------------------------------------------------

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface TaskApplicationPort {
  // Template commands
  createTaskTemplate: CreateTaskTemplate;
  updateTaskTemplate: UpdateTaskTemplate;
  activateTaskTemplate: ActivateTaskTemplate;
  pauseTaskTemplate: PauseTaskTemplate;
  archiveTaskTemplate: ArchiveTaskTemplate;
  deleteTaskTemplate: DeleteTaskTemplate;
  generateTaskInstances: GenerateTaskInstances;
  bindTaskToGoal: BindTaskToGoal;
  unbindTaskFromGoal: UnbindTaskFromGoal;

  // Template queries
  getTaskTemplate: GetTaskTemplate;
  listTaskTemplates: ListTaskTemplates;
  listTaskTemplatesByPriority: ListTaskTemplatesByPriority;

  // Instance commands
  completeTaskInstance: CompleteTaskInstance;
  skipTaskInstance: SkipTaskInstance;
  startTaskInstance: StartTaskInstance;
  deleteTaskInstance: DeleteTaskInstance;
  checkExpiredInstances: CheckExpiredInstances;

  // Instance queries
  getTaskInstance: GetTaskInstance;
  listTaskInstancesByAccount: ListTaskInstancesByAccount;
  listTaskInstancesByTemplate: ListTaskInstancesByTemplate;
  listTaskInstancesByStatus: ListTaskInstancesByStatus;
  getTaskInstancesByDateRange: GetTaskInstancesByDateRange;

  // Dependency commands
  createTaskDependency: CreateTaskDependency;
  deleteTaskDependency: DeleteTaskDependency;
  updateTaskDependency: UpdateTaskDependency;

  // Dependency queries
  listTaskDependencies: ListTaskDependencies;
  getDependencyChain: GetDependencyChain;
  validateTaskDependency: ValidateTaskDependency;
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

  return {
    // Template commands
    createTaskTemplate: new CreateTaskTemplate(taskTemplateRepository, taskInstanceRepository),
    updateTaskTemplate: new UpdateTaskTemplate(taskTemplateRepository),
    activateTaskTemplate: new ActivateTaskTemplate(taskTemplateRepository, taskInstanceRepository),
    pauseTaskTemplate: new PauseTaskTemplate(taskTemplateRepository, taskInstanceRepository),
    archiveTaskTemplate: new ArchiveTaskTemplate(taskTemplateRepository),
    deleteTaskTemplate: new DeleteTaskTemplate(taskTemplateRepository),
    generateTaskInstances: new GenerateTaskInstances(
      taskTemplateRepository,
      taskInstanceRepository,
    ),
    bindTaskToGoal: new BindTaskToGoal(taskTemplateRepository),
    unbindTaskFromGoal: new UnbindTaskFromGoal(taskTemplateRepository),

    // Template queries
    getTaskTemplate: new GetTaskTemplate(taskTemplateRepository),
    listTaskTemplates: new ListTaskTemplates(taskTemplateRepository, taskInstanceRepository),
    listTaskTemplatesByPriority: new ListTaskTemplatesByPriority(taskTemplateRepository),

    // Instance commands
    completeTaskInstance: new CompleteTaskInstance(taskInstanceRepository, taskTemplateRepository),
    skipTaskInstance: new SkipTaskInstance(taskInstanceRepository),
    startTaskInstance: new StartTaskInstance(taskInstanceRepository),
    deleteTaskInstance: new DeleteTaskInstance(taskInstanceRepository),
    checkExpiredInstances: new CheckExpiredInstances(taskInstanceRepository),

    // Instance queries
    getTaskInstance: new GetTaskInstance(taskInstanceRepository),
    listTaskInstancesByAccount: new ListTaskInstancesByAccount(taskInstanceRepository),
    listTaskInstancesByTemplate: new ListTaskInstancesByTemplate(taskInstanceRepository),
    listTaskInstancesByStatus: new ListTaskInstancesByStatus(taskInstanceRepository),
    getTaskInstancesByDateRange: new GetTaskInstancesByDateRange(taskInstanceRepository),

    // Dependency commands
    createTaskDependency: new CreateTaskDependency(taskDependencyRepository),
    deleteTaskDependency: new DeleteTaskDependency(taskDependencyRepository),
    updateTaskDependency: new UpdateTaskDependency(taskDependencyRepository),

    // Dependency queries
    listTaskDependencies: new ListTaskDependencies(taskDependencyRepository),
    getDependencyChain: new GetDependencyChain(taskDependencyRepository),
    validateTaskDependency: new ValidateTaskDependency(taskDependencyRepository),
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
