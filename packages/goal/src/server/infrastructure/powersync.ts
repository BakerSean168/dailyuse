/**
 * Convenience factory — PowerSync-backed goal module for Electron.
 * 便捷工厂 — 基于 PowerSync 的 Electron 目标模块。
 *
 * Mirrors `packages/governance/src/infrastructure/powersync.ts`.
 * 对标 `packages/governance/src/infrastructure/powersync.ts`。
 */

import {
  createGoalModule,
  type GoalModuleInstance,
  type GoalRuntimeContributionsInput,
} from './goal.module';
import { GoalPowerSyncRepository } from './adapters/powersync/goal-powersync.repository';
import { GoalFolderPowerSyncRepository } from './adapters/powersync/goal-folder-powersync.repository';
import { GoalRecordPowerSyncRepository } from './adapters/powersync/goal-record-powersync.repository';
import { FocusModePowerSyncRepository } from './adapters/powersync/focus-mode-powersync.repository';
import { PowerSyncGoalWriteTransactionRunner } from './adapters/powersync/powersync-goal-write-transaction-runner';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import { createGoalScheduleExecutionSource } from './schedule-execution-source';
import { createGoalScheduleProjectionSource } from './schedule-projection-source';
import type { GoalScheduleExecutionSource } from '../../schedule-execution';
import type { GoalScheduleProjectionSource } from '../../schedule-projection';
import { createGoalTaskProgressHandler } from '../application/event-handlers';

export function createGoalPowerSyncModule(
  db: IElectronDatabase,
  options?: {
    runtimeContributions?: GoalRuntimeContributionsInput;
  },
): GoalModuleInstance {
  return createGoalModule({
    goalRepository: new GoalPowerSyncRepository(db),
    goalFolderRepository: new GoalFolderPowerSyncRepository(db),
    goalRecordRepository: new GoalRecordPowerSyncRepository(db),
    focusModeRepository: new FocusModePowerSyncRepository(db),
    goalWriteTransactionRunner: new PowerSyncGoalWriteTransactionRunner(db),
    runtimeContributions: options?.runtimeContributions,
  });
}

export function createGoalPowerSyncScheduleProjectionSource(
  db: IElectronDatabase,
): GoalScheduleProjectionSource {
  return createGoalScheduleProjectionSource({
    goalRepository: new GoalPowerSyncRepository(db),
  });
}

/** Desktop Task -> Goal integration handler backed by one PowerSync transaction. */
export function createGoalTaskProgressPowerSyncHandler(db: IElectronDatabase) {
  return createGoalTaskProgressHandler(
    new GoalPowerSyncRepository(db),
    new GoalRecordPowerSyncRepository(db),
    new PowerSyncGoalWriteTransactionRunner(db),
  );
}

export function createGoalPowerSyncScheduleExecutionSource(
  db: IElectronDatabase,
): GoalScheduleExecutionSource {
  return createGoalScheduleExecutionSource({
    goalRepository: new GoalPowerSyncRepository(db),
  });
}

export {
  GoalPowerSyncRepository,
  GoalFolderPowerSyncRepository,
  GoalRecordPowerSyncRepository,
  FocusModePowerSyncRepository,
};
