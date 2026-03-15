/**
 * @dailyuse/notification
 *
 * 通知模块 - 多渠道通知管理
 *
 * 【业务场景】
 * 多渠道通知管理，包含：
 * - 创建、查询、标记已读/删除通知
 * - 通知偏好设置
 * - 通知模板管理
 * - 跨模块事件驱动通知（reminder:triggered, schedule:task:executed）
 *
 * 【分层架构】
 *
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │  contracts (契约层) — @dailyuse/contracts/notification   │
 * │  - 类型定义（interface/type）                            │
 * │  - DTO（Client/Server/Persistence）                     │
 * │  - API Schema (Zod)                                     │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-shared (共享领域层)                              │
 * │  - 值对象（前后端共享）                                  │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-server (服务端领域层)                            │
 * │  - 聚合根（Notification, NotificationPreference）       │
 * │  - 仓储接口（INotificationRepository）                  │
 * │  - 领域服务                                              │
 * └─────────────────────────────────────────────────────────┘
 * ```
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约层类型
 * import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
 *
 * // 2. 导入值对象
 * import { NotificationChannelId } from '@dailyuse/notification/domain-shared';
 *
 * // 3. 导入聚合根
 * import { Notification, INotificationRepository } from '@dailyuse/notification/domain-server';
 *
 * // 4. 使用组合根
 * import { createNotificationModule } from '@dailyuse/notification/infrastructure-server';
 * const module = createNotificationModule({
 *   notificationRepository, preferenceRepository, templateRepository,
 * });
 * module.start();
 * const result = await module.api.getUnreadCount(identityId);
 * ```
 */

// ================= Contracts Layer (契约层) =================
// Type definitions, DTOs, Events, API Schemas
export * from '@dailyuse/contracts/notification';

// ================= Domain Layer (领域层) =================
// Domain-Shared: Value objects and shared logic
// Domain-Server: Aggregates, entities, repositories (server-side)
// Domain-Client: Client-side domain models (UI view models)
export * from './domain-server';

// Note: domain-client exports are available via '@dailyuse/notification/domain-client'
// to avoid name conflicts with server-side models.

// ================= Application Layer (应用层) =================
// Application-Server: Use cases (server-side)
// Application-Client: Client services, view model mappers
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer (基础设施层) =================
// Infrastructure-Server: Repositories, persistence, composition root (server-side)
// Infrastructure-Client: HTTP/IPC adapters (client-side)
export {
  /** @internal Concrete Prisma implementation — use INotificationRepository interface instead. Prisma 具体实现 — 请使用 INotificationRepository 接口。 */
  NotificationPrismaRepository,
  /** @internal Concrete Prisma implementation — use INotificationPreferenceRepository interface instead. Prisma 具体实现 — 请使用 INotificationPreferenceRepository 接口。 */
  NotificationPreferencePrismaRepository,
  /** @internal Concrete Prisma implementation — use INotificationTemplateRepository interface instead. Prisma 具体实现 — 请使用 INotificationTemplateRepository 接口。 */
  NotificationTemplatePrismaRepository,
  /** @internal Concrete PowerSync implementation — use INotificationRepository interface instead. PowerSync 具体实现 — 请使用 INotificationRepository 接口。 */
  PowerSyncNotificationRepository,
  /** @internal Concrete PowerSync implementation — use INotificationPreferenceRepository interface instead. PowerSync 具体实现 — 请使用 INotificationPreferenceRepository 接口。 */
  PowerSyncNotificationPreferenceRepository,
  /** @internal Concrete PowerSync implementation — use INotificationTemplateRepository interface instead. PowerSync 具体实现 — 请使用 INotificationTemplateRepository 接口。 */
  PowerSyncNotificationTemplateRepository,
  createNotificationModule,
  createNotificationPowerSyncModule,
  type NotificationApplicationPort,
  type NotificationModuleDependencies,
  type NotificationModuleInstance,
  type NotificationModuleRuntimeContribution,
  type NotificationModuleUseCases,
} from './infrastructure-server';

export * from './infrastructure-client';
