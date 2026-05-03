/**
 * PowerSync Composition Root — convenience factory for Electron desktop.
 * PowerSync 组合根 —— Electron 桌面端的便捷工厂。
 *
 * This file wires PowerSync-backed repositories into the canonical
 * createGovernanceModule() composition root. It is a thin wrapper:
 * 本文件将基于 PowerSync 的仓储接入标准的 createGovernanceModule() 组合根。它是一个薄包装层：
 *
 * 1. Creates PowerSyncRuleRepository and PowerSyncRuleRevisionRepository from the SQLite db
 *    从 SQLite db 创建 PowerSyncRuleRepository 和 PowerSyncRuleRevisionRepository
 * 2. Passes them to createGovernanceModule() as concrete adapters
 *    将它们作为具体适配器传入 createGovernanceModule()
 * 3. Returns a fully assembled GovernanceModuleInstance
 *    返回一个完全组装好的 GovernanceModuleInstance
 *
 * Pattern for other modules:
 * 其他模块的参考模式：
 * - One such file per persistence technology (powersync.ts, prisma.ts, etc.)
 *   每种持久化技术一个文件（powersync.ts、prisma.ts 等）
 * - Each file selects concrete adapters and delegates to the canonical composition root
 *   每个文件选择具体适配器并委托给标准组合根
 * - Re-exports concrete classes for direct use in tests or advanced scenarios
 *   重新导出具体类，供测试或高级场景直接使用
 */

import { createGovernanceModule, type GovernanceModuleInstance } from './governance.module';
import { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository } from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

/**
 * Creates a governance module instance backed by PowerSync (SQLite) for Electron desktop.
 * 创建基于 PowerSync（SQLite）的治理模块实例，用于 Electron 桌面端。
 *
 * @param db - Electron SQLite database instance Electron SQLite 数据库实例
 * @returns Fully assembled GovernanceModuleInstance 完全组装好的 GovernanceModuleInstance
 */
export function createGovernancePowerSyncModule(db: IElectronDatabase): GovernanceModuleInstance {
  return createGovernanceModule({
    ruleRepository: new PowerSyncRuleRepository(db),
    revisionRepository: new PowerSyncRuleRevisionRepository(db),
  });
}

export { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository };
