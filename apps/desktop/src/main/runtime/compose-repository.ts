/**
 * Repository Electron composition root — desktop lane host runtime.
 * 仓库 Electron 组合根 —— desktop lane 宿主运行时。
 *
 * This is the desktop-lane composition root for repository. Unlike every other
 * module, repository has NO PowerSync / deep-module DB assembly in the desktop
 * lane: the Local Vault, the remote knowledge-repository gateway, the Git
 * runtime, the reconciliation / sync services and the auto-sync scheduler are
 * ALL host ports owned by the desktop main runtime. This composer only accepts
 * those already-built ports and turns them into an already-bound
 * `IElectronModule`-compatible handle via `createRepositoryElectronModule`.
 *
 * 这是仓库在 desktop lane 的组合根。与其它模块不同，仓库在桌面 lane 没有
 * PowerSync / 深模块 DB 组装：Local Vault、远端知识仓库网关、Git runtime、
 * reconciliation / sync 服务与 auto-sync scheduler 全部是桌面主进程持有的宿主
 * ports。本 composer 只接收这些已构建的 ports，并通过 `createRepositoryElectronModule`
 * 把它们变成已绑定 instance 的、兼容 `IElectronModule` 的 handle。
 *
 * Do not invent a `createRepositoryPowerSyncModule` / PowerSync infrastructure
 * file — there is none in this package by design (plan §3.3). The composer owns
 * exactly the five host ports the transport module declares.
 *
 * 不要凭空发明 `createRepositoryPowerSyncModule` / PowerSync infrastructure 文件——
 * 本包按设计就没有（计划 §3.3）。composer 恰好拥有传输模块声明的五个宿主 ports。
 */

import {
  createRepositoryElectronModule,
  type KnowledgeRepositoryAutoSyncSchedulerElectronPort,
  type KnowledgeRepositoryConnectionElectronPort,
  type KnowledgeRepositoryReconciliationElectronPort,
  type KnowledgeRepositorySyncElectronPort,
  type LocalVaultElectronPort,
  type RepositoryElectronModuleDef,
} from '@memoflow/repository/electron';

/**
 * Dependencies the repository composer needs from the desktop host runtime.
 * 仓库 composer 需要从 desktop 宿主运行时拿到的依赖。
 */
export interface ComposeRepositoryDesktopDependencies {
  /** Local Vault runtime owned by the desktop main process. 桌面主进程持有的 Local Vault runtime。 */
  readonly localVaultPort: LocalVaultElectronPort;
  /** Remote knowledge-repository gateway (online account capabilities). 远端知识仓库网关（在线账户能力）。 */
  readonly knowledgeRepositoryConnectionPort: KnowledgeRepositoryConnectionElectronPort;
  /** Reconciliation service running the Git runtime. 运行 Git runtime 的 reconciliation 服务。 */
  readonly knowledgeRepositoryReconciliationPort: KnowledgeRepositoryReconciliationElectronPort;
  /** Sync service committing local changes to the remote. 把本地变更提交到远端的 sync 服务。 */
  readonly knowledgeRepositorySyncPort: KnowledgeRepositorySyncElectronPort;
  /** Auto-sync scheduler with lifecycle + commit-on-stop. 带生命周期与停止时提交的 auto-sync scheduler。 */
  readonly knowledgeRepositoryAutoSyncScheduler: KnowledgeRepositoryAutoSyncSchedulerElectronPort;
}

/**
 * Composes the repository Electron module handle from the host-provided ports.
 * 用宿主提供的 ports 组装仓库 Electron module handle。
 *
 * Wire order: the host builds Local Vault / remote gateway / Git runtime /
 * reconciliation / sync / auto-sync scheduler ports first, then this composer
 * hands the SAME instances to `createRepositoryElectronModule` — the transport
 * module only registers IPC channels and owns the auto-sync scheduler
 * lifecycle. No DB adapter is created here.
 *
 * 接线顺序：宿主先构建 Local Vault / 远端网关 / Git runtime / reconciliation /
 * sync / auto-sync scheduler ports，然后本 composer 把同一实例交给
 * `createRepositoryElectronModule`——传输模块只注册 IPC 通道并托管 auto-sync
 * scheduler 生命周期。这里不创建任何 DB 适配器。
 *
 * The returned handle is already fully bound: ElectronBootstrapper.register()
 * must be called with it once (Repository register is async and awaited), and its
 * destroy() stops the auto-sync scheduler and removes all channels.
 *
 * 返回的 handle 已完全绑定：ElectronBootstrapper.register() 必须恰好注册一次
 * （Repository register 是异步的并会被 await），其 destroy() 会停止 auto-sync
 * scheduler 并移除全部通道。
 *
 * @param dependencies - ComposeRepositoryDesktopDependencies with the host repository ports.
 * @returns RepositoryElectronModuleDef — an already-bound IElectronModule-compatible handle.
 */
export function composeRepository(
  dependencies: ComposeRepositoryDesktopDependencies,
): RepositoryElectronModuleDef {
  return createRepositoryElectronModule({
    localVaultPort: dependencies.localVaultPort,
    knowledgeRepositoryConnectionPort: dependencies.knowledgeRepositoryConnectionPort,
    knowledgeRepositoryReconciliationPort: dependencies.knowledgeRepositoryReconciliationPort,
    knowledgeRepositorySyncPort: dependencies.knowledgeRepositorySyncPort,
    knowledgeRepositoryAutoSyncScheduler: dependencies.knowledgeRepositoryAutoSyncScheduler,
  });
}
