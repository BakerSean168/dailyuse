/**
 * PowerSync composition root for governance.
 * Governance 的 PowerSync 组合根。
 *
 * This file wires PowerSync-backed repositories into the canonical
 * createGovernanceModule() composition root and attaches the same module-owned
 * runtime adapter used by the Prisma entry.
 *
 * 本文件将基于 PowerSync 的仓储接入标准的 createGovernanceModule() 组合根，
 * 并注入与 Prisma 入口一致的模块自有运行时适配器。
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import { createGovernanceModule, type GovernanceModuleInstance } from './governance.module';
import { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository } from './adapters/powersync';
import { createGovernanceEventLogRuntime } from './runtime';
import type { GovernanceRepositorySet } from './prisma';

/**
 * Creates PowerSync-backed governance repositories.
 * 创建基于 PowerSync 的治理仓储。
 *
 * Electron counterpart of createGovernancePrismaRepositories(): selects the
 * PowerSync adapters and returns the same repository Port shape, so the
 * transport-neutral createGovernanceModule() is host-agnostic.
 *
 * 与 createGovernancePrismaRepositories() 对应的 Electron 版本：
 * 选择 PowerSync 适配器并返回相同的仓储 Port 形状，
 * 从而让 transport-neutral 的 createGovernanceModule() 与宿主技术无关。
 *
 * @param db - Electron database adapter owned by the desktop main runtime.
 * @returns Repository set backed by the PowerSync adapters.
 */
export function createGovernancePowerSyncRepositories(
  db: IElectronDatabase,
): GovernanceRepositorySet {
  return {
    ruleRepository: new PowerSyncRuleRepository(db),
    revisionRepository: new PowerSyncRuleRevisionRepository(db),
  };
}

/**
 * Creates a PowerSync-backed governance module instance.
 * 创建基于 PowerSync 的治理模块实例。
 *
 * Convenience root kept for in-package reuse / rollback; delegates to
 * createGovernancePowerSyncRepositories() plus the canonical module assembly.
 *
 * 便捷组合根，保留用于包内复用与回滚；委托给
 * createGovernancePowerSyncRepositories() 与规范化模块装配。
 *
 * @param db - Electron database adapter used by the desktop main runtime.
 * @returns GovernanceModuleInstance with module-owned runtime adapters attached.
 */
export function createGovernancePowerSyncModule(
  db: IElectronDatabase,
): GovernanceModuleInstance {
  const { ruleRepository, revisionRepository } = createGovernancePowerSyncRepositories(db);
  return createGovernanceModule({
    ruleRepository,
    revisionRepository,
    runtimeAdapters: createGovernanceEventLogRuntime(),
  });
}