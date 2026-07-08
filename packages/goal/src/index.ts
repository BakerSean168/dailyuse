/**
 * @dailyuse/goal
 *
 * Goal module runtime root.
 *
 * Public goal contracts are centralized in
 * `@dailyuse/contracts/goal`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 * Goal-specific analytics, events, and schedule orchestration seams
 * remain on their dedicated subpaths.
 */

export {
  createGoalModule,
  createGoalPrismaModule,
  createGoalPrismaRepositories,
  createGoalPowerSyncModule,
  createGoalRuntimeContribution,
  createGoalUseCases,
  type GoalApplicationPort,
  type GoalModuleDependencies,
  type GoalModuleInstance,
  type GoalModuleRuntimeContribution,
  type GoalModuleUseCases,
  type GoalRuntimeContributionsInput,
  type GoalRuntimeContribution,
} from './server';
