/**
 * Notification API Module
 * 通知 API 模块
 *
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - 内部完成 Composition Root 组装
 * - 通过 context.middleware 使用平台级中间件（auth, rbac）
 * - 通过 context.router 挂载路由
 *
 * apps/api 只需一行代码：
 * ```typescript
 * .register(NotificationApiModule)
 * ```
 *
 * 路由前缀：/notifications
 */

export { NotificationApiModule } from './module';
export type { NotificationApiModuleContext, NotificationApiModuleDef } from './module';
export {
  createNotificationRuntimeContribution,
  type NotificationRuntimeContribution,
} from './runtime';
export { createNotificationTransportHandlers } from './transport-handlers';
export { NotificationController, type NotificationUseCases } from '../controllers';
export { createNotificationPrismaModule, createNotificationPrismaRepositories } from './prisma';
export type { CreateNotificationPrismaModuleOptions } from './prisma';
export { createNotificationPowerSyncModule } from '../infrastructure-server';
export {
  PowerSyncNotificationRepository,
  PowerSyncNotificationTemplateRepository,
  PowerSyncNotificationPreferenceRepository,
} from '../infrastructure-server';
export type {
  NotificationModuleInstance,
  NotificationModuleDependencies,
  NotificationApplicationPort,
} from '../infrastructure-server';
