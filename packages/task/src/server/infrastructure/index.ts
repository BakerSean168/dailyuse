/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Persistence mappers
 *   持久化映射器
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use ITaskTemplateRepository interface instead. Prisma 具体实现 — 请使用 ITaskTemplateRepository 接口。 */
export { TaskTemplatePrismaRepository } from './adapters/prisma/task-template-prisma.repository';
/** @internal Concrete Prisma implementation — use ITaskInstanceRepository interface instead. Prisma 具体实现 — 请使用 ITaskInstanceRepository 接口。 */
export { TaskInstancePrismaRepository } from './adapters/prisma/task-instance-prisma.repository';
/** @internal Concrete Prisma implementation — use ITaskDependencyRepository interface instead. Prisma 具体实现 — 请使用 ITaskDependencyRepository 接口。 */
export { TaskDependencyPrismaRepository } from './adapters/prisma/task-dependency-prisma.repository';
/** @internal Concrete Prisma implementation — use ITaskFolderRepository interface instead. Prisma 具体实现 — 请使用 ITaskFolderRepository 接口。 */
export { TaskFolderPrismaRepository } from './adapters/prisma/task-folder-prisma.repository';
export { PrismaTaskWriteTransactionRunner } from './adapters/prisma/prisma-task-write-transaction-runner';
export { PrismaTaskGoalOutboxDispatchStore } from './adapters/prisma/prisma-task-goal-outbox-dispatch-store';
export { PrismaTaskBindingReadPort } from './adapters/prisma/prisma-task-binding-read-port';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export {
  PowerSyncTaskTemplateRepository,
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskDependencyRepository,
  PowerSyncTaskFolderRepository,
  PowerSyncTaskWriteTransactionRunner,
  PowerSyncTaskGoalOutboxDispatchStore,
  PowerSyncTaskBindingReadPort,
} from './adapters/powersync';

// ============ Composition Root ============
export {
  createTaskModule,
  createTaskUseCases,
  type TaskModuleDependencies,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
  type TaskModuleUseCases,
  type TaskRuntimeContributionsInput,
} from './task.module';
export type { TaskApplicationPort } from '../application';
export {
  createTaskPowerSyncModule,
  createTaskPowerSyncRepositories,
  createTaskPowerSyncScheduleExecutionSource,
  createTaskPowerSyncScheduleProjectionSource,
} from './powersync';
export {
  createTaskPrismaModule,
  createTaskPrismaRepositories,
  createTaskPrismaScheduleExecutionSource,
  createTaskPrismaScheduleProjectionSource,
  type CreateTaskPrismaModuleOptions,
  type TaskRepositorySet,
} from './prisma';
export { createTaskRuntimeContribution } from './runtime';
export {
  createTaskGoalOutboxRuntime,
  type TaskGoalOutboxRuntimeOptions,
} from './task-goal-outbox-runtime';
export {
  createTaskScheduleExecutionSource,
  type CreateTaskScheduleExecutionSourceDeps,
} from './schedule-execution-source';
export {
  createTaskScheduleProjectionSource,
  createTaskScheduleProjectionEventHandlers,
  taskScheduleProjectionEventNames,
  type TaskScheduleProjectionEventMap,
  type TaskScheduleProjectionHandlers,
  type TaskScheduleProjectionPlan,
  type TaskScheduleProjectionSelection,
  type TaskScheduleProjectionSource,
} from './schedule-projection-source';
