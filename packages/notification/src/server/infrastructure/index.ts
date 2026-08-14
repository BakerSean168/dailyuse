/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Public seam: ingredient factories, set types, module factory, runtime
 * contribution factories and port types. Concrete adapter classes do not leak
 * through this barrel unless a transport/app still consumes them directly
 * (marked @internal, removed in Step E).
 *
 * 公共 seam：仅导出原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
 * 除非 transport/app 仍直接消费（以 @internal 标记，Step E 移除），
 * 具体适配器类不通过该 barrel 泄漏。
 */

// ============ Composition Root ============
export {
  createNotificationModule,
  createNotificationUseCases,
  type NotificationModuleDependencies,
  type NotificationModuleInstance,
  type NotificationModuleRuntimeContribution,
  type NotificationModuleUseCases,
  type NotificationRuntimeContributionsInput,
} from './notification.module';
export type { NotificationApplicationPort } from '../application';
export type {
  INotificationRepository,
  INotificationPreferenceRepository,
  INotificationTemplateRepository,
} from '../domain/repositories';
export type { NotificationReliableOperationPort } from '@memoflow/contracts/reliable-messaging';

export { createNotificationPowerSyncModule } from './powersync';
export {
  createNotificationPowerSyncRepositories,
  createPowerSyncClosureChecker,
  createDefaultElectronDesktopTransport,
  type CreateNotificationPowerSyncModuleOptions,
  type NotificationPowerSyncRepositorySet,
  type DesktopTransportAckRecord,
  type DesktopTransportAckStore,
} from './powersync';
export {
  createNotificationPrismaModule,
  createNotificationPrismaRepositories,
  createNotificationPrismaScheduleNotificationPort,
  type CreateNotificationPrismaModuleOptions,
  type NotificationPrismaRepositorySet,
} from './prisma';
export {
  createNotificationRuntimeContribution,
  createNotificationDurableRuntime,
  type ChannelCapabilitySpec,
  type NotificationChannelDeliverer,
  type NotificationDurableRuntimePort,
} from './runtime';

// ============ Adapters still consumed by frozen transports/apps ============
/** @internal 仍被 electron 模块直接消费的具体 PowerSync 实现 — Step E 移除。 */
export {
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
} from './adapters/powersync';
/** @internal 仍被 apps/api 直接消费的具体 consumer 类 — Step E 移除。 */
export { NotificationAccountClosedConsumer } from './consumers/notification-account-closed.consumer';
