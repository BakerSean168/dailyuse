/**
 * @dailyuse/notification
 *
 * Notification module runtime root.
 *
 * Public notification contracts are centralized in
 * `@dailyuse/contracts/notification`.
 * Root exports are limited to the canonical server composition roots.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createNotificationModule,
  createNotificationPrismaModule,
  createNotificationPrismaRepositories,
  createNotificationPowerSyncModule,
  createNotificationRuntimeContribution,
  type NotificationApplicationPort,
  type NotificationModuleDependencies,
  type NotificationModuleInstance,
  type NotificationModuleRuntimeContribution,
  type NotificationModuleUseCases,
} from './server';
