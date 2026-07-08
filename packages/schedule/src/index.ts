/**
 * @dailyuse/schedule
 *
 * Schedule module runtime root.
 *
 * Public schedule contracts are centralized in
 * `@dailyuse/contracts/schedule`.
 * Root exports are limited to the server runtime composition root plus
 * the minimal server-side task/repository contracts still used by
 * schedule orchestration.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createScheduleModule,
  createSchedulePowerSyncModule,
  createSchedulePrismaModule,
  createScheduleTaskPrismaRepository,
  type ScheduleApplicationPort,
  type ScheduleModuleDependencies,
  type ScheduleModuleInstance,
  type ScheduleModuleRuntimeContribution,
  type ScheduleModuleUseCases,
  type ScheduleRuntimeContributionsInput,
} from './server';
export { ScheduleTask } from './server';
export type { IScheduleRepository, IScheduleTaskRepository } from './server';
export type { ScheduleTaskExecutionResult, ScheduleTaskSourceExecutor } from './server';
