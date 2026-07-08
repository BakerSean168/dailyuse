/**
 * @dailyuse/task
 *
 * Task module runtime root.
 *
 * Public task contracts are centralized in
 * `@dailyuse/contracts/task`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 * Task-specific analytics, testing, and schedule orchestration seams
 * remain on their dedicated subpaths.
 */

export {
  createTaskModule,
  createTaskPowerSyncModule,
  createTaskPrismaModule,
  createTaskPrismaRepositories,
  createTaskRuntimeContribution,
  createTaskUseCases,
  type TaskApplicationPort,
  type TaskModuleDependencies,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
  type TaskModuleUseCases,
  type TaskRuntimeContributionsInput,
  type CreateTaskPrismaModuleOptions,
  type TaskRuntimeContribution,
} from './server';
