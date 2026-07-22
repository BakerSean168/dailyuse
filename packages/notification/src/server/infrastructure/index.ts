/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Persistence mappers
 *   持久化映射器
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use INotificationRepository interface instead. Prisma 具体实现 — 请使用 INotificationRepository 接口。 */
export {
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository,
} from './adapters/prisma';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export {
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
} from './adapters/powersync';

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
export { createNotificationPowerSyncModule } from './powersync';
export {
  createNotificationPrismaModule,
  createNotificationPrismaRepositories,
  createNotificationPrismaScheduleNotificationPort,
  type CreateNotificationPrismaModuleOptions,
} from './prisma';
export {
  createNotificationRuntimeContribution,
} from './runtime';
