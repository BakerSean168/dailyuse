/**
 * Convenience factory — PowerSync-backed goal module for Electron.
 * 便捷工厂 — 基于 PowerSync 的 Electron 目标模块。
 *
 * Mirrors `packages/governance/src/infrastructure-server/powersync.ts`.
 * 对标 `packages/governance/src/infrastructure-server/powersync.ts`。
 */

import { createGoalModule, type GoalModuleInstance } from './goal.module';
import { GoalPowerSyncRepository } from './adapters/powersync/goal-powersync.repository';
import { GoalFolderPowerSyncRepository } from './adapters/powersync/goal-folder-powersync.repository';
import { GoalRecordPowerSyncRepository } from './adapters/powersync/goal-record-powersync.repository';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

export function createGoalPowerSyncModule(db: IElectronDatabase): GoalModuleInstance {
  return createGoalModule({
    goalRepository: new GoalPowerSyncRepository(db),
    goalFolderRepository: new GoalFolderPowerSyncRepository(db),
    goalRecordRepository: new GoalRecordPowerSyncRepository(db),
  });
}

export { GoalPowerSyncRepository, GoalFolderPowerSyncRepository, GoalRecordPowerSyncRepository };
