/**
 * @memoflow/notification
 *
 * Notification module runtime root.
 *
 * Public notification contracts are centralized in
 * `@memoflow/contracts/notification`.
 * Root exports are limited to the canonical server composition roots:
 * ingredient factories, set types, module factory, runtime contribution
 * factories and port types. Client / API / Electron seams use dedicated
 * subpaths.
 *
 * 通知模块运行时根。
 * 公开契约集中在 `@memoflow/contracts/notification`。
 * 根导出仅限于规范化的服务端组合根：原料工厂、集合类型、模块工厂、
 * 运行时贡献工厂与 Port 类型。Client / API / Electron 使用独立 subpath。
 */

export {
  createNotificationModule,
  createNotificationPrismaModule,
  createNotificationPrismaRepositories,
  createNotificationPrismaScheduleNotificationPort,
  createNotificationPowerSyncModule,
  createNotificationPowerSyncRepositories,
  createNotificationRuntimeContribution,
  createNotificationDurableRuntime,
  createPowerSyncClosureChecker,
  createDefaultElectronDesktopTransport,
  type NotificationApplicationPort,
  type NotificationModuleDependencies,
  type NotificationModuleInstance,
  type NotificationModuleRuntimeContribution,
  type NotificationModuleUseCases,
  type NotificationPrismaRepositorySet,
  type NotificationPowerSyncRepositorySet,
  type ChannelCapabilitySpec,
  type NotificationChannelDeliverer,
  type NotificationDurableRuntimePort,
  type INotificationRepository,
  type INotificationPreferenceRepository,
  type INotificationTemplateRepository,
} from './server';
