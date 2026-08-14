/**
 * Governance API composition root — API lane host runtime.
 * 治理 API 组合根 —— API lane 宿主运行时。
 *
 * This is the API-lane composition root for governance. The API runtime owns
 * the shared Prisma connection (created in main.ts by connectDatabase()), so it
 * selects the Prisma persistence adapters, builds the event-log runtime adapter,
 * assembles the transport-neutral `GovernanceModuleInstance`, and turns it into
 * an already-bound `IApiModule`-compatible handle via `createGovernanceApiModule`.
 *
 * 这是治理在 API lane 的组合根。API runtime 拥有共享的 Prisma 连接
 * （由 main.ts 的 connectDatabase() 创建），因此由它选择 Prisma 持久化适配器、
 * 构建 event-log runtime 适配器、装配与传输无关的 `GovernanceModuleInstance`，
 * 再通过 `createGovernanceApiModule` 变成已绑定 instance 的、兼容 `IApiModule`
 * 的 module handle。
 *
 * Assembly order (plan §3.1) — MUST be: runtime db → repositories →
 * event-log runtime → governance instance → API module. This keeps the
 * dependency direction explicit: the host picks adapters, the governance deep
 * module stays transport-agnostic, and the returned handle only registers
 * transport + lifecycle.
 *
 * 组装顺序（计划 §3.1）必须为：runtime db → repositories → event-log runtime →
 * governance instance → API module。这使依赖方向显式化：宿主选择适配器，
 * governance 深模块保持与传输无关，返回的 handle 只负责 transport 注册与生命周期。
 *
 * Deliberately narrow interface: governance consumes only the `db` Prisma
 * capability, so the composer accepts exactly that and nothing more. Do not
 * widen it to mirror future composers (e.g. compose-goal.ts) with unused
 * parameters — unused capabilities add implicit ordering and test burden.
 *
 * 刻意保持窄接口：治理只消费 `db` Prisma capability，
 * 因此本 composer 恰好接受这一个依赖，不多不少。
 * 不要为了匹配未来 composer（如 compose-goal.ts）的宽依赖形状而引入未使用参数——
 * 未使用的能力只会带来隐含顺序与测试负担。
 */

import type { PrismaClient } from '@memoflow/database';
import {
  createGovernanceEventLogRuntime,
  createGovernanceModule,
  createGovernancePrismaRepositories,
} from '@memoflow/governance';
import {
  createGovernanceApiModule,
  type GovernanceApiModuleDef,
} from '@memoflow/governance/api';

/**
 * Dependencies the governance composer needs from the API host runtime.
 * 治理 composer 需要从 API 宿主运行时拿到的依赖。
 */
export interface ComposeGovernanceDependencies {
  /** Shared API-lane Prisma client owned by apps/api. */
  readonly db: PrismaClient;
}

/**
 * Composes the governance API module handle from the API runtime's Prisma client.
 * 用 API runtime 的 Prisma client 组装治理 API module handle。
 *
 * Wire order:
 * 1. createGovernancePrismaRepositories(db) — select the Prisma adapters.
 * 2. createGovernanceEventLogRuntime() — build the reversible event-log runtime.
 * 3. createGovernanceModule({ ruleRepository, revisionRepository, runtimeAdapters })
 *    — assemble the transport-neutral governance instance.
 * 4. createGovernanceApiModule({ instance }) — bind the instance to an
 *    IApiModule handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createGovernancePrismaRepositories(db) —— 选择 Prisma 适配器。
 * 2. createGovernanceEventLogRuntime() —— 构建可逆的 event-log runtime。
 * 3. createGovernanceModule({ ruleRepository, revisionRepository, runtimeAdapters })
 *    —— 装配与传输无关的治理实例。
 * 4. createGovernanceApiModule({ instance }) —— 把实例绑定到 IApiModule handle
 *    （只负责 transport 与生命周期）。
 *
 * The returned handle is already fully bound: ApiBootstrapper.register() must
 * be called with it once, and its destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ApiBootstrapper.register() 必须恰好注册一次，
 * 其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeGovernanceDependencies with the runtime Prisma client.
 * @returns GovernanceApiModuleDef — an already-bound IApiModule-compatible handle.
 */
export function composeGovernance(
  dependencies: ComposeGovernanceDependencies,
): GovernanceApiModuleDef {
  const { ruleRepository, revisionRepository } = createGovernancePrismaRepositories(
    dependencies.db,
  );
  const runtimeAdapters = createGovernanceEventLogRuntime();
  const instance = createGovernanceModule({
    ruleRepository,
    revisionRepository,
    runtimeAdapters,
  });
  return createGovernanceApiModule({ instance });
}
