/**
 * Notification API composition root — API lane host runtime.
 * 通知 API 组合根 —— API lane 宿主运行时。
 *
 * This is the API-lane composition root for notification. The API runtime owns
 * the shared Prisma connection (created in main.ts by connectDatabase()) and
 * passes the host-owned closure checker and channel capabilities, so it selects
 * the Prisma persistence adapters, builds the module-owned durable runtime, and
 * assembles the transport-neutral `NotificationModuleInstance`. The instance is
 * then bound to an `IApiModule`-compatible handle via `createNotificationApiModule`.
 *
 * 这是通知在 API lane 的组合根。API runtime 拥有共享的 Prisma 连接
 * （由 main.ts 的 connectDatabase() 创建），并传入宿主持有的 closure checker 与
 * channel capabilities，因此由它选择 Prisma 持久化适配器、构建模块自有 durable
 * runtime，并装配与传输无关的 `NotificationModuleInstance`。实例随后通过
 * `createNotificationApiModule` 绑定为兼容 `IApiModule` 的 handle。
 *
 * Assembly order (plan §3.3) — MUST be: runtime db → notification Prisma
 * repository set → durable runtime (channel capabilities + transport) →
 * notification instance → API module. The composer also builds the
 * `ScheduleNotificationPort` from the SAME repository set so schedule
 * orchestration does not construct a second Prisma repository set.
 *
 * 组装顺序（计划 §3.3）必须为：runtime db → 通知 Prisma 仓储集合 → durable
 * runtime（channel capabilities + transport）→ notification instance → API module。
 * composer 还从同一仓储集合构建 `ScheduleNotificationPort`，使 schedule 编排无需
 * 再构造第二套 Prisma 仓储集合。
 *
 * Deliberately narrow interface: the host supplies the shared Prisma client, the
 * closure checker and the explicit channel capability list. Capability selection
 * stays visible — the API lane declares only InApp (its explicit policy), never
 * a silently-decided default list.
 *
 * 刻意保持窄接口：宿主提供共享 Prisma client、closure checker 与显式 channel
 * capability 列表。能力选择保持可见——API lane 只声明 InApp（其显式策略），
 * 绝不静默决定默认能力列表。
 */

import type { PrismaClient } from '@memoflow/database';
import {
  createNotificationDurableRuntime,
  createNotificationModule,
  createNotificationPrismaRepositories,
  createNotificationScheduleNotificationPort,
  type ChannelCapabilitySpec,
  type INotificationRepository,
  type ScheduleNotificationPort,
} from '@memoflow/notification';
import {
  createNotificationApiModule,
  type NotificationApiModuleDef,
} from '@memoflow/notification/api';

/**
 * Dependencies the notification composer needs from the API host runtime.
 * 通知 composer 需要从 API 宿主运行时拿到的依赖。
 */
export interface ComposeNotificationDependencies {
  /** Shared API-lane Prisma client owned by apps/api. 由 apps/api 持有的共享 API lane Prisma client。 */
  readonly db: PrismaClient;
  /** Host-owned account-active checker (fail-closed for closed accounts). 宿主持有的账户激活检查器（对已关闭账户 fail-closed）。 */
  readonly closureChecker: (identityId: string) => Promise<boolean>;
  /** Explicit channel capabilities selected by the host. 宿主显式选择的 channel capabilities。 */
  readonly channelCapabilities: readonly ChannelCapabilitySpec[];
}

/**
 * Composed notification surface for the API host.
 * 通知在 API 宿主的组装结果。
 */
export interface ComposedNotification {
  /** Already-bound IApiModule-compatible handle. 已绑定的 IApiModule 兼容 handle。 */
  readonly module: NotificationApiModuleDef;
  /** Instance-bound repository view for sibling modules. 暴露给兄弟模块的 instance-bound 仓储视图。 */
  readonly repositories: { readonly notificationRepository: INotificationRepository };
  /** Schedule notification port built from the SAME repository set. 从同一仓储集合构建的 schedule notification port。 */
  readonly scheduleNotificationPort: ScheduleNotificationPort;
}

/**
 * Composes the notification API module handle from the API runtime's Prisma client.
 * 用 API runtime 的 Prisma client 组装通知 API module handle。
 *
 * Wire order:
 * 1. createNotificationPrismaRepositories(db) — select the Prisma adapters.
 * 2. createNotificationDurableRuntime({ notificationRepository, reliableAdapter,
 *    channelCapabilities }) — build the module-owned durable runtime from the
 *    host capability selection.
 * 3. createNotificationModule({ ...repositories, closureChecker, durableRuntime,
 *    runtimeContributions: [durableRuntime], auditRepository }) — assemble the
 *    transport-neutral notification instance.
 * 4. createNotificationScheduleNotificationPort({ ...repositories, closureChecker })
 *    — build the ScheduleNotificationPort from the SAME repository set (so schedule
 *    orchestration shares one set).
 * 5. createNotificationApiModule({ instance }) — bind the instance to an
 *    IApiModule handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createNotificationPrismaRepositories(db) —— 选择 Prisma 适配器。
 * 2. createNotificationDurableRuntime({ notificationRepository, reliableAdapter,
 *    channelCapabilities }) —— 依据宿主能力选择构建模块自有 durable runtime。
 * 3. createNotificationModule({ ...repositories, closureChecker, durableRuntime,
 *    runtimeContributions: [durableRuntime], auditRepository }) —— 装配与传输无关的
 *    通知实例。
 * 4. createNotificationScheduleNotificationPort({ ...repositories, closureChecker })
 *    —— 从同一仓储集合构建 ScheduleNotificationPort（使 schedule 编排共享一套集合）。
 * 5. createNotificationApiModule({ instance }) —— 把实例绑定到 IApiModule handle
 *    （只负责 transport 与生命周期）。
 *
 * The returned handle is already fully bound: ApiBootstrapper.register() must
 * be called with it once, and its destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ApiBootstrapper.register() 必须恰好注册一次，
 * 其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeNotificationDependencies with the runtime Prisma client and host ports.
 * @returns ComposedNotification — the bound module handle plus the schedule notification port.
 */
export function composeNotification(
  dependencies: ComposeNotificationDependencies,
): ComposedNotification {
  const repositories = createNotificationPrismaRepositories(dependencies.db);

  const durableRuntime = createNotificationDurableRuntime({
    notificationRepository: repositories.notificationRepository,
    reliableAdapter: repositories.reliableAdapter,
    channelCapabilities: Array.from(dependencies.channelCapabilities),
  });

  const instance = createNotificationModule({
    notificationRepository: repositories.notificationRepository,
    preferenceRepository: repositories.notificationPreferenceRepository,
    templateRepository: repositories.notificationTemplateRepository,
    closureChecker: dependencies.closureChecker,
    durableRuntime,
    runtimeContributions: [durableRuntime],
    auditRepository: repositories.auditRepository,
  });

  const createNotificationPort = createNotificationScheduleNotificationPort({
    notificationRepository: repositories.notificationRepository,
    notificationTemplateRepository: repositories.notificationTemplateRepository,
    notificationPreferenceRepository: repositories.notificationPreferenceRepository,
    closureChecker: dependencies.closureChecker,
  });

  return {
    module: createNotificationApiModule({ instance }),
    repositories: {
      notificationRepository: repositories.notificationRepository,
    },
    scheduleNotificationPort: createNotificationPort,
  };
}
