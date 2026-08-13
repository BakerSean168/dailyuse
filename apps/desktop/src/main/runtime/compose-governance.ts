/**
 * Governance Electron composition root — desktop lane host runtime.
 * 治理 Electron 组合根 —— desktop lane 宿主运行时。
 *
 * This is the desktop-lane composition root for governance. The desktop main
 * runtime owns the per-profile PowerSync database (IElectronDatabase), so it
 * selects the PowerSync persistence adapters, builds the event-log runtime
 * adapter, assembles the transport-neutral `GovernanceModuleInstance`, and
 * turns it into an already-bound `IElectronModule`-compatible handle via
 * `createGovernanceElectronModule`.
 *
 * 这是治理在 desktop lane 的组合根。桌面主进程运行时拥有按 profile 划分的
 * PowerSync 数据库（IElectronDatabase），因此由它选择 PowerSync 持久化适配器、
 * 构建 event-log runtime 适配器、装配与传输无关的 `GovernanceModuleInstance`，
 * 再通过 `createGovernanceElectronModule` 变成已绑定 instance 的、兼容
 * `IElectronModule` 的 module handle。
 *
 * The same transport-neutral createGovernanceModule() / GovernanceApplicationPort
 * is reused with a PowerSync adapter only — this is the Electron counterpart of
 * apps/api/src/runtime/compose-governance.ts (plan §3.4), keeping HTTP/IPC
 * parity: both hosts swap only the persistence adapter, never the business
 * logic. The API lane composes Prisma repositories; the desktop lane composes
 * PowerSync repositories.
 *
 * 这里复用的是同一个 transport-neutral 的 createGovernanceModule() /
 * GovernanceApplicationPort，只是换上了 PowerSync 适配器——这是
 * apps/api/src/runtime/compose-governance.ts 的 Electron 对应实现（计划 §3.4），
 * 以保持 HTTP/IPC 对齐：两个宿主只替换持久化适配器，不复制业务逻辑。
 * API lane 组合 Prisma 仓储；desktop lane 组合 PowerSync 仓储。
 *
 * Assembly order (plan §3.1, mirrored) — MUST be: runtime db → repositories →
 * event-log runtime → governance instance → Electron module. This keeps the
 * dependency direction explicit: the host picks adapters, the governance deep
 * module stays transport-agnostic, and the returned handle only registers
 * transport + lifecycle.
 *
 * 组装顺序（镜像计划 §3.1）必须为：runtime db → repositories → event-log runtime →
 * governance instance → Electron module。这使依赖方向显式化：宿主选择适配器，
 * governance 深模块保持与传输无关，返回的 handle 只负责 transport 注册与生命周期。
 *
 * Deliberately narrow interface: governance consumes only the `db` Electron
 * database capability, so the composer accepts exactly that and nothing more.
 * Do not widen it to mirror future composers with unused parameters — unused
 * capabilities add implicit ordering and test burden.
 *
 * 刻意保持窄接口：治理只消费 `db` Electron 数据库 capability，
 * 因此本 composer 恰好接受这一个依赖，不多不少。
 * 不要为了匹配未来 composer 的宽依赖形状而引入未使用参数——
 * 未使用的能力只会带来隐含顺序与测试负担。
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  createGovernanceEventLogRuntime,
  createGovernanceModule,
  createGovernancePowerSyncRepositories,
} from '@memoflow/governance';
import {
  createGovernanceElectronModule,
  type GovernanceElectronModuleDef,
} from '@memoflow/governance/electron';

/**
 * Dependencies the governance composer needs from the desktop host runtime.
 * 治理 composer 需要从 desktop 宿主运行时拿到的依赖。
 */
export interface ComposeGovernanceDependencies {
  /** PowerSync-backed desktop business database owned by the desktop main runtime. */
  readonly db: IElectronDatabase;
}

/**
 * Composes the governance Electron module handle from the desktop runtime's
 * database. 用 desktop runtime 的数据库组装治理 Electron module handle。
 *
 * Wire order:
 * 1. createGovernancePowerSyncRepositories(db) — select the PowerSync adapters.
 * 2. createGovernanceEventLogRuntime() — build the reversible event-log runtime.
 * 3. createGovernanceModule({ ruleRepository, revisionRepository, runtimeAdapters })
 *    — assemble the transport-neutral governance instance.
 * 4. createGovernanceElectronModule({ instance }) — bind the instance to an
 *    IElectronModule handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createGovernancePowerSyncRepositories(db) —— 选择 PowerSync 适配器。
 * 2. createGovernanceEventLogRuntime() —— 构建可逆的 event-log runtime。
 * 3. createGovernanceModule({ ruleRepository, revisionRepository, runtimeAdapters })
 *    —— 装配与传输无关的治理实例。
 * 4. createGovernanceElectronModule({ instance }) —— 把实例绑定到 IElectronModule
 *    handle（只负责 transport 与生命周期）。
 *
 * The returned handle is already fully bound: ElectronBootstrapper.register()
 * must be called with it once, and its destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ElectronBootstrapper.register() 必须恰好注册一次，
 * 其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeGovernanceDependencies with the runtime Electron database.
 * @returns GovernanceElectronModuleDef — an already-bound IElectronModule-compatible handle.
 */
export function composeGovernance(
  dependencies: ComposeGovernanceDependencies,
): GovernanceElectronModuleDef {
  const { ruleRepository, revisionRepository } = createGovernancePowerSyncRepositories(
    dependencies.db,
  );
  const runtimeAdapters = createGovernanceEventLogRuntime();
  const instance = createGovernanceModule({
    ruleRepository,
    revisionRepository,
    runtimeAdapters,
  });
  return createGovernanceElectronModule({ instance });
}
