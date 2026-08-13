/**
 * @memoflow/goal
 *
 * Goal module runtime root.
 *
 * Public goal contracts are centralized in
 * `@memoflow/contracts/goal`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 * Goal-specific analytics, events, and schedule orchestration seams
 * remain on their dedicated subpaths.
 */

export {
  createGoalModule,
  createGoalPrismaModule,
  createGoalPrismaRepositories,
  createGoalTaskProgressPrismaHandler,
  createGoalPowerSyncModule,
  createGoalPowerSyncRepositories,
  createGoalTaskProgressPowerSyncHandler,
  createGoalRuntimeContribution,
  createGoalEventListenersRuntime,
  createGoalUseCases,
  type GoalApplicationPort,
  type GoalModuleDependencies,
  type GoalModuleInstance,
  type GoalModuleRuntimeContribution,
  type GoalModuleUseCases,
  type GoalRuntimeContributionsInput,
  type GoalRepositorySet,
  type GoalEventListenersRuntime,
} from './server';

export {
  GoalTaskProgressHandler,
  createGoalTaskProgressHandler,
  type TaskGoalProgressHandler,
} from './server/application';
