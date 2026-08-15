/**
 * Reminder API composition root — API lane host runtime.
 * 提醒 API 组合根 —— API lane 宿主运行时。
 *
 * This is the API-lane composition root for reminder. The API runtime owns the
 * shared Prisma connection (created in main.ts by connectDatabase()) and passes
 * the host-owned closure checker, so it selects the Prisma persistence adapters,
 * assembles the transport-neutral `ReminderModuleInstance` (module-owned cron /
 * snooze / reliable / audit runtime included), and turns it into an
 * already-bound `IApiModule`-compatible handle via `createReminderApiModule`.
 *
 * 这是提醒在 API lane 的组合根。API runtime 拥有共享的 Prisma 连接
 * （由 main.ts 的 connectDatabase() 创建），并传入宿主持有的 closure checker，
 * 因此由它选择 Prisma 持久化适配器、装配与传输无关的 `ReminderModuleInstance`
 * （含模块自有 cron / snooze / reliable / audit runtime），再通过 `createReminderApiModule`
 * 变成已绑定 instance 的、兼容 `IApiModule` 的 module handle。
 *
 * Assembly order (plan §3.3) — MUST be: runtime db → reminder Prisma repository
 * set → module-owned trigger cron runtime (from the SAME set) → reminder
 * instance → schedule execution / projection sources built from the SAME
 * repository set → API module. Schedule orchestration consumes the returned
 * sources instead of constructing a second Prisma repository set.
 *
 * 组装顺序（计划 §3.3）必须为：runtime db → 提醒 Prisma 仓储集合 → 模块自有触发
 * cron runtime（来自同一集合）→ reminder instance → 从同一仓储集合构建的
 * schedule execution / projection sources → API module。schedule 编排消费返回的
 * sources，而不再构造第二套 Prisma 仓储集合。
 *
 * The reminder trigger cron is a module-owned runtime contribution restored to
 * merge-base behavior (the API lane started `createReminderTriggerCronJob` on
 * module start): it starts with `instance.start()` and stops on dispose. The
 * desktop PowerSync lane intentionally does NOT wire the cron — it has no
 * Prisma reliable/transaction ports and never had the cron at merge-base.
 *
 * 提醒触发 cron 是恢复到 merge-base 行为的模块自有运行时贡献（API lane 在模块启动时
 * 启动 `createReminderTriggerCronJob`）：随 `instance.start()` 启动、dispose 停止。
 * desktop PowerSync lane 刻意不接 cron——它没有 Prisma reliable/transaction ports，
 * 且 merge-base 时代就从未有过该 cron。
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
  createReminderModule,
  createReminderPrismaRepositories,
  createReminderTriggerCronRuntime,
  createReminderScheduleExecutionSource,
  createReminderScheduleProjectionSource,
  createReminderUseCases,
  type ReminderModuleRuntimeContribution,
  type ReminderRuntimeContributionsInput,
  type IReminderTemplateRepository,
} from '@memoflow/reminder';
import {
  createReminderApiModule,
  type ReminderApiModuleDef,
} from '@memoflow/reminder/api';
import type { ReminderScheduleExecutionSource } from '@memoflow/reminder';
import type { ReminderScheduleProjectionSource } from '@memoflow/reminder';
import type { ReminderApplicationPort } from '@memoflow/reminder';

/**
 * Dependencies the reminder composer needs from the API host runtime.
 * 提醒 composer 需要从 API 宿主运行时拿到的依赖。
 */
export interface ComposeReminderDependencies {
  /** Shared API-lane Prisma client owned by apps/api. 由 apps/api 持有的共享 API lane Prisma client。 */
  readonly db: PrismaClient;
  /** Host-owned account-active checker (fail-closed for closed accounts). 宿主持有的账户激活检查器（对已关闭账户 fail-closed）。 */
  readonly closureChecker: (identityId: string) => Promise<boolean>;
  /**
   * Optional executor-visible closure checker. When provided, the composed
   * result exposes `executorReminderPort`, whose `createTemplate` uses this
   * frozen merge-base predicate (account status + requested|revoking|closing
   * phases) instead of the module's account-active checker. The AI executor
   * path MUST receive this predicate, not the module checker.
   *
   * 可选的 executor 可见闭户检查器。提供后，组装结果暴露 `executorReminderPort`，
   * 其 `createTemplate` 使用该冻结的 merge-base 谓词（账户状态 +
   * requested|revoking|closing 阶段），而非模块的账户激活检查器。AI executor
   * 路径必须收到该谓词，而不是模块检查器。
   */
  readonly executorClosureChecker?: (identityId: string) => Promise<boolean>;
  /** Extra runtime contributions from the host. 宿主提供的额外运行时贡献。 */
  readonly runtimeContributions?: ReminderRuntimeContributionsInput;
}

/**
 * Build the host-owned executor closure predicate frozen from merge-base.
 * 构建从 merge-base 冻结的、宿主持有的 executor 闭户谓词。
 *
 * Blocks when the account row is missing / `Deactivated` / `Closed`, or when an
 * active account-closure operation exists in phases `requested` | `revoking` |
 * `closing`. A `revoked` / `closed` operation alone does NOT block, and the
 * account status is always inspected first — exactly the predicate the
 * merge-base executor passed to its own reminder module. It is restored here
 * so the AI executor path keeps the pre-RefArch behavior while sharing the
 * single composed reminder instance.
 *
 * 账户缺失 / `Deactivated` / `Closed` 时阻断；或存在处于 `requested` | `revoking`
 * | `closing` 阶段的有效闭户操作时阻断。单独的 `revoked` / `closed` 操作不阻断，
 * 且始终先检查账户状态——这正是 merge-base 时代 executor 传给其自建提醒模块的
 * 谓词。在此恢复，使 AI executor 路径在共享单一组合提醒实例的同时保持
 * RefArch 之前的既有行为。
 *
 * @param db - API host-owned Prisma client. API 宿主持有的 Prisma client。
 * @returns An async predicate returning true to block new reminder work. 返回 true 表示阻断新提醒工作的异步谓词。
 */
export function createExecutorClosureChecker(
  db: PrismaClient,
): (identityId: string) => Promise<boolean> {
  return async (identityId: string): Promise<boolean> => {
    const account = await db.account.findUnique({
      where: { id: identityId },
      select: { status: true },
    });
    if (!account || account.status === 'Deactivated' || account.status === 'Closed') {
      return true;
    }
    const pendingClosure = await db.accountClosureOperation.findFirst({
      where: {
        identityId,
        phase: { in: ['requested', 'revoking', 'closing'] },
      },
    });
    return pendingClosure !== null;
  };
}

/**
 * Composed reminder surface for the API host.
 * 提醒在 API 宿主的组装结果。
 */
export interface ComposedReminder {
  /** Already-bound IApiModule-compatible handle. 已绑定的 IApiModule 兼容 handle。 */
  readonly module: ReminderApiModuleDef;
  /** The transport-neutral application port (`instance.api`) for sibling modules to orchestrate. 供兄弟模块编排的与传输无关 application port（`instance.api`）。 */
  readonly applicationPort: ReminderApplicationPort;
  /**
   * The application port the AI executor must consume: its `createTemplate`
   * uses the frozen merge-base closure predicate when `executorClosureChecker`
   * is provided, otherwise it is the same object as `applicationPort`.
   * 供 AI executor 消费的 application port：提供 `executorClosureChecker` 时其
   * `createTemplate` 使用冻结的 merge-base 闭户谓词，否则与 `applicationPort`
   * 是同一对象。
   */
  readonly executorReminderPort: ReminderApplicationPort;
  /** Repository views exposed to sibling modules in the same host. 暴露给同一宿主内兄弟模块的仓储视图。 */
  readonly repositories: { readonly reminderTemplateRepository: IReminderTemplateRepository };
  /** Schedule execution source built from the SAME repository set. 从同一仓储集合构建的 schedule execution source。 */
  readonly scheduleExecutionSource: ReminderScheduleExecutionSource;
  /** Schedule projection source built from the SAME repository set. 从同一仓储集合构建的 schedule projection source。 */
  readonly scheduleProjectionSource: ReminderScheduleProjectionSource;
}

function normalizeRuntimeContributions(
  runtimeContributions?: ReminderRuntimeContributionsInput,
): readonly ReminderModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }
  return Array.isArray(runtimeContributions)
    ? Array.from(runtimeContributions)
    : [runtimeContributions as ReminderModuleRuntimeContribution];
}

/**
 * Composes the reminder API module handle from the API runtime's Prisma client.
 * 用 API runtime 的 Prisma client 组装提醒 API module handle。
 *
 * Wire order:
 * 1. createReminderPrismaRepositories(db) — select the Prisma adapters and the
 *    module-owned snooze / reliable / audit ingredients.
 * 2. createReminderTriggerCronRuntime({ reminderTemplateRepository,
 *    reminderGroupRepository, reliablePort, transactionRunner }) — the module-owned
 *    every-minute trigger cron (merge-base behavior), built from the SAME set.
 * 3. createReminderModule({ ...set, closureChecker,
 *    runtimeContributions: [cronRuntime, ...host] }) — assemble the
 *    transport-neutral reminder instance.
 * 4. createReminderScheduleExecutionSource / createReminderScheduleProjectionSource
 *    — build the schedule sources from the SAME repository set (consumed by
 *    schedule orchestration).
 * 5. createReminderApiModule({ instance }) — bind the instance to an IApiModule
 *    handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createReminderPrismaRepositories(db) —— 选择 Prisma 适配器与模块自有 snooze /
 *    reliable / audit 原料。
 * 2. createReminderTriggerCronRuntime({ reminderTemplateRepository,
 *    reminderGroupRepository, reliablePort, transactionRunner }) —— 模块自有每分钟
 *    触发 cron（merge-base 行为），由同一集合构建。
 * 3. createReminderModule({ ...set, closureChecker,
 *    runtimeContributions: [cronRuntime, ...host] }) —— 装配与传输无关的提醒实例。
 * 4. createReminderScheduleExecutionSource / createReminderScheduleProjectionSource
 *    —— 从同一仓储集合构建 schedule sources（供 schedule 编排消费）。
 * 5. createReminderApiModule({ instance }) —— 把实例绑定到 IApiModule handle
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
 * @returns ComposedReminder — the bound module handle, application port, repository view and schedule sources.
 */
export function composeReminder(
  dependencies: ComposeReminderDependencies,
): ComposedReminder {
  const repositories = createReminderPrismaRepositories(dependencies.db);

  const cronRuntime = createReminderTriggerCronRuntime({
    reminderTemplateRepository: repositories.reminderTemplateRepository,
    reminderGroupRepository: repositories.reminderGroupRepository,
    reliablePort: repositories.reliablePort,
    transactionRunner: repositories.transactionRunner,
  });

  const instance = createReminderModule({
    reminderTemplateRepository: repositories.reminderTemplateRepository,
    reminderGroupRepository: repositories.reminderGroupRepository,
    reminderResponseRepository: repositories.reminderResponseRepository,
    userReminderPreferenceRepository: repositories.userReminderPreferenceRepository,
    closureChecker: dependencies.closureChecker,
    reliablePort: repositories.reliablePort,
    snoozeRescheduler: repositories.snoozeRescheduler,
    auditRepository: repositories.auditRepository,
    runtimeContributions: [
      cronRuntime,
      ...normalizeRuntimeContributions(dependencies.runtimeContributions),
    ],
  });

  const reminderTemplateRepository = instance.reminderTemplateRepository;
  const scheduleExecutionSource = createReminderScheduleExecutionSource({
    reminderTemplateRepository,
  });
  const scheduleProjectionSource = createReminderScheduleProjectionSource({
    reminderTemplateRepository,
  });

  // Executor-visible closure path: when the host supplies the frozen
  // merge-base predicate, expose a port whose createTemplate runs through a
  // use case carrying that predicate (sharing the SAME repositories as the
  // single module instance). All other methods delegate to instance.api.
  // Without an executor checker the executor port is simply the module api.
  //
  // Executor 可见的闭户路径：宿主提供冻结的 merge-base 谓词时，暴露一个
  // createTemplate 走该谓词 use case 的 port（与单一模块实例共享同一套仓储）。
  // 其余方法全部委托给 instance.api；未提供 executor 检查器时该 port 即模块 api。
  const executorUseCases =
    dependencies.executorClosureChecker === undefined
      ? null
      : createReminderUseCases({
          reminderTemplateRepository: repositories.reminderTemplateRepository,
          reminderGroupRepository: repositories.reminderGroupRepository,
          reminderResponseRepository: repositories.reminderResponseRepository,
          userReminderPreferenceRepository: repositories.userReminderPreferenceRepository,
          closureChecker: dependencies.executorClosureChecker,
        });

  const executorReminderPort: ReminderApplicationPort =
    executorUseCases === null
      ? instance.api
      : {
          ...instance.api,
          createTemplate: (data, ctx) =>
            executorUseCases.createReminderTemplate.execute(data, ctx),
        };

  return {
    module: createReminderApiModule({ instance }),
    applicationPort: instance.api,
    executorReminderPort,
    repositories: { reminderTemplateRepository },
    scheduleExecutionSource,
    scheduleProjectionSource,
  };
}
