/**
 * Task API Module Exports.
 * 任务 API 模块导出。
 *
 * Public API surface for task module integration.
 * 任务模块集成的公开 API 表面。
 *
 * apps/api only needs one line:
 * apps/api 只需一行代码：
 * ```typescript
 * .register(TaskApiModule)
 * ```
 *
 * Route prefixes:
 * 路由前缀：
 * - /tasks (primary 主路径)
 */

export { TaskApiModule, createTaskApiModule } from './module';
export type { TaskApiModuleContext, TaskApiModuleOptions } from './module';
export {
  createTaskPrismaModule,
  createTaskPrismaRepositories,
  createTaskPrismaScheduleExecutionSource,
  createTaskPrismaScheduleProjectionSource,
} from './prisma';
export type { CreateTaskPrismaModuleOptions } from './prisma';
export {
  createTaskPowerSyncModule,
  createTaskPowerSyncScheduleExecutionSource,
} from '../infrastructure-server';
export {
  PowerSyncTaskTemplateRepository,
  PowerSyncTaskInstanceRepository,
} from '../infrastructure-server';
export type {
  TaskModuleInstance,
  TaskModuleDependencies,
  TaskApplicationPort,
  TaskModuleRuntimeContribution,
  TaskModuleUseCases,
} from '../infrastructure-server';
