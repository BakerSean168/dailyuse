/**
 * @memoflow/reminder
 *
 * Reminder module runtime root.
 *
 * Public reminder contracts are centralized in
 * `@memoflow/contracts/reminder`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 * Schedule orchestration integrations remain on their dedicated
 * `schedule-execution` / `schedule-projection` seams.
 */

export {
  createReminderModule,
  createReminderPrismaModule,
  createReminderPrismaRepositories,
  createReminderPowerSyncModule,
  createReminderRuntimeContribution,
  createReminderUseCases,
  type ReminderApplicationPort,
  type ReminderModuleDependencies,
  type ReminderModuleInstance,
  type ReminderModuleRuntimeContribution,
  type ReminderModuleUseCases,
  type ReminderRuntimeContributionsInput,
} from './server';
