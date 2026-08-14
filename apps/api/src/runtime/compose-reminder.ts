/**
 * Reminder API composition root — API lane host runtime.
 * 提醒 API 组合根 —— API lane 宿主运行时。
 *
 * This is the API-lane composition root for reminder. The API runtime owns the
 * shared Prisma connection (created in main.ts by connectDatabase()) and passes
 * the host-owned closure checker, so it selects the Prisma persistence adapters,
 * assembles the transport-neutral `ReminderModuleInstance` (module-owned
 * snooze / reliable / audit runtime included), and turns it into an
 * already-bound `IApiModule`-compatible handle via `createReminderApiModule`.
 *
 * 这是提醒在 API lane 的组合根。API runtime 拥有共享的 Prisma 连接
 * （由 main.ts 的 connectDatabase() 创建），并传入宿主持有的 closure checker，
 * 因此由它选择 Prisma 持久化适配器、装配与传输无关的 `ReminderModuleInstance`
 * （含模块自有 snooze / reliable / audit runtime），再通过 `createReminderApiModule`
 * 变成已绑定 instance 的、兼容 `IApiModule` 的 module handle。
 *
 * Assembly order (plan §3.3) — MUST be: runtime db → reminder Prisma module
 * (repository set + snooze/reliable/audit assembly) → schedule execution /
 * projection sources built from the SAME repository set → reminder instance →
 * API module. Schedule orchestration consumes the returned sources instead of
 * constructing a second Prisma repository set.
 *
 * 组装顺序（计划 §3.3）必须为：runtime db → 提醒 Prisma module（仓储集合 +
 * snooze/reliable/audit 装配）→ 从同一仓储集合构建的 schedule execution /
 * projection sources → reminder instance → API module。schedule 编排消费返回的
 * sources，而不再构造第二套 Prisma 仓储集合。
 *
 * Deliberately narrow interface: the host supplies the shared Prisma client and
 * the required closure checker (fail-closed) plus optional extra runtime
 * contributions. Unused capabilities (transports, storage dirs) are not accepted.
 *
 * 刻意保持窄接口：宿主提供共享 Prisma client 与必需的 closure checker
 * （fail-closed）以及可选额外运行时贡献。不接收未使用的能力（transport、存储目录等）。
 */

import type { PrismaClient } from '@memoflow/database';
import {
  createReminderPrismaModule,
  type ReminderRuntimeContributionsInput,
  type IReminderTemplateRepository,
} from '@memoflow/reminder';
import {
  createReminderApiModule,
  type ReminderApiModuleDef,
} from '@memoflow/reminder/api';
import {
  createReminderScheduleExecutionSource,
  type ReminderScheduleExecutionSource,
} from '@memoflow/reminder/schedule-execution';
import {
  createReminderScheduleProjectionSource,
  type ReminderScheduleProjectionSource,
} from '@memoflow/reminder/schedule-projection';

/**
 * Dependencies the reminder composer needs from the API host runtime.
 * 提醒 composer 需要从 API 宿主运行时拿到的依赖。
 */
export interface ComposeReminderDependencies {
  /** Shared API-lane Prisma client owned by apps/api. 由 apps/api 持有的共享 API lane Prisma client。 */
  readonly db: PrismaClient;
  /** Host-owned account-active checker (fail-closed for closed accounts). 宿主持有的账户激活检查器（对已关闭账户 fail-closed）。 */
  readonly closureChecker: (identityId: string) => Promise<boolean>;
  /** Extra runtime contributions from the host. 宿主提供的额外运行时贡献。 */
  readonly runtimeContributions?: ReminderRuntimeContributionsInput;
}

/**
 * Composed reminder surface for the API host.
 * 提醒在 API 宿主的组装结果。
 */
export interface ComposedReminder {
  /** Already-bound IApiModule-compatible handle. 已绑定的 IApiModule 兼容 handle。 */
  readonly module: ReminderApiModuleDef;
  /** Repository views exposed to sibling modules in the same host. 暴露给同一宿主内兄弟模块的仓储视图。 */
  readonly repositories: { readonly reminderTemplateRepository: IReminderTemplateRepository };
  /** Schedule execution source built from the SAME repository set. 从同一仓储集合构建的 schedule execution source。 */
  readonly scheduleExecutionSource: ReminderScheduleExecutionSource;
  /** Schedule projection source built from the SAME repository set. 从同一仓储集合构建的 schedule projection source。 */
  readonly scheduleProjectionSource: ReminderScheduleProjectionSource;
}

/**
 * Composes the reminder API module handle from the API runtime's Prisma client.
 * 用 API runtime 的 Prisma client 组装提醒 API module handle。
 *
 * Wire order:
 * 1. createReminderPrismaModule(db, { closureChecker, runtimeContributions })
 *    — select the Prisma adapters and assemble the transport-neutral reminder
 *    instance (module-owned snooze/reliable/audit runtime included). The
 *    repository set lives inside this convenience root, so the schedule sources
 *    below share the exact same repositories.
 * 2. createReminderScheduleExecutionSource({ reminderTemplateRepository }) and
 *    createReminderScheduleProjectionSource({ reminderTemplateRepository }) —
 *    build the schedule sources from the SAME repository set (consumed by
 *    schedule orchestration).
 * 3. createReminderApiModule({ instance }) — bind the instance to an IApiModule
 *    handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createReminderPrismaModule(db, { closureChecker, runtimeContributions })
 *    —— 选择 Prisma 适配器并装配与传输无关的提醒实例（含模块自有 snooze/reliable/
 *    audit runtime）。仓储集合位于该便捷组合根内部，因此下方 schedule sources
 *    与它共享完全相同的仓储。
 * 2. createReminderScheduleExecutionSource({ reminderTemplateRepository }) 与
 *    createReminderScheduleProjectionSource({ reminderTemplateRepository })
 *    —— 从同一仓储集合构建 schedule sources（供 schedule 编排消费）。
 * 3. createReminderApiModule({ instance }) —— 把实例绑定到 IApiModule handle
 *    （只负责 transport 与生命周期）。
 *
 * The returned handle is already fully bound: ApiBootstrapper.register() must
 * be called with it once (Reminder register is async and awaited), and its
 * destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ApiBootstrapper.register() 必须恰好注册一次
 * （Reminder register 是异步的并会被 await），其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeReminderDependencies with the runtime Prisma client.
 * @returns ComposedReminder — the bound module handle, repository view and schedule sources.
 */
export function composeReminder(
  dependencies: ComposeReminderDependencies,
): ComposedReminder {
  const instance = createReminderPrismaModule(dependencies.db, {
    closureChecker: dependencies.closureChecker,
    runtimeContributions: dependencies.runtimeContributions,
  });

  const reminderTemplateRepository = instance.reminderTemplateRepository;
  const scheduleExecutionSource = createReminderScheduleExecutionSource({
    reminderTemplateRepository,
  });
  const scheduleProjectionSource = createReminderScheduleProjectionSource({
    reminderTemplateRepository,
  });

  return {
    module: createReminderApiModule({ instance }),
    repositories: { reminderTemplateRepository },
    scheduleExecutionSource,
    scheduleProjectionSource,
  };
}
