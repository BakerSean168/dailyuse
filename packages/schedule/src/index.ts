/**
 * @memoflow/schedule
 *
 * Schedule module runtime root.
 *
 * Public schedule contracts are centralized in
 * `@memoflow/contracts/schedule`.
 * Root exports are limited to the server runtime composition root plus
 * the minimal server-side task/repository contracts still used by
 * schedule orchestration: ingredient factories, set types, module factory,
 * runtime contribution factories and port types.
 * Client / API / Electron seams use dedicated subpaths.
 *
 * 调度模块运行时根。
 * 公开契约集中在 `@memoflow/contracts/schedule`。
 * 根导出仅限于服务端运行时组合根及 schedule 编排仍使用的最小服务端
 * task/repository 契约：原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
 * Client / API / Electron 使用独立 subpath。
 */

export {
  createScheduleModule,
  createSchedulePowerSyncModule,
  createSchedulePowerSyncRepositories,
  createSchedulePrismaModule,
  createSchedulePrismaRepositories,
  createScheduleTaskPrismaRepository,
  createScheduleRuntimeContribution,
  createScheduleTaskSchedulingPort,
  createHandlerRegistryScheduleTaskSourceExecutor,
  type ScheduleApplicationPort,
  type ScheduleModuleDependencies,
  type ScheduleModuleInstance,
  type ScheduleModuleRuntimeContribution,
  type ScheduleModuleUseCases,
  type ScheduleRuntimeContributionsInput,
  type ScheduleRepositorySet,
  type SchedulePowerSyncRepositories,
  type ScheduleRuntimeDependencies,
} from './server';
export { ScheduleTask } from './server';
export type { IScheduleRepository, IScheduleTaskRepository, IScheduleExecutionRepository } from './server';
export type { ScheduleTaskExecutionResult, ScheduleTaskSourceExecutor } from './server';

// HandlerRegistry is runtime infrastructure; public data contracts stay in @memoflow/contracts/schedule.
export { ScheduledHandlerRegistry } from './scheduling';
