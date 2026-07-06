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

import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { createGovernanceModule, type GovernanceModuleInstance } from './governance.module';
import { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository } from './adapters/powersync';
import { createGovernanceEventLogRuntime } from './runtime';

/**
 * Creates a PowerSync-backed governance module instance.
 * 创建基于 PowerSync 的治理模块实例。
 *
 * @param db - Electron database adapter used by the desktop main runtime.
 * @returns GovernanceModuleInstance with module-owned runtime adapters attached.
 */
export function createGovernancePowerSyncModule(db: IElectronDatabase): GovernanceModuleInstance {
  return createGovernanceModule({
    ruleRepository: new PowerSyncRuleRepository(db),
    revisionRepository: new PowerSyncRuleRevisionRepository(db),
    runtimeAdapters: createGovernanceEventLogRuntime(),
  });
}