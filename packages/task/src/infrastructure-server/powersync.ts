/**
 * createTaskPowerSyncModule — PowerSync composition root for the task module.
 * createTaskPowerSyncModule —— 任务模块的 PowerSync 组合根。
 *
 * Thin factory that selects PowerSync adapters and delegates to the canonical
 * composition root. Used exclusively in Electron main process.
 *
 * 选择 PowerSync 适配器并委托给规范组合根的轻量工厂。
 * 仅在 Electron 主进程中使用。
 */

import type { IElectronDatabase, IElectronDatabaseTransaction } from '@dailyuse/contracts/electron';
import {
  createTaskModule,
  type TaskModuleInstance,
  type TaskRuntimeContributionsInput,
} from './task.module';
import {
  PowerSyncTaskTemplateRepository,
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskDependencyRepository,
  PowerSyncTaskFolderRepository,
  PowerSyncTaskWriteTransactionRunner,
} from './adapters/powersync';
import {
  createTaskScheduleProjectionSource,
} from './schedule-projection-source';
import { createTaskScheduleExecutionSource } from './schedule-execution-source';
import type { TaskScheduleExecutionSource } from '../schedule-execution';
import type { TaskScheduleProjectionSource } from '../schedule-projection';

type TaskPowerSyncQueryable = IElectronDatabaseTransaction;

/**
 * Creates a task module instance with PowerSync adapters.
 * 使用 PowerSync 适配器创建任务模块实例。
 *
 * @param db - PowerSync desktop database runtime. PowerSync 桌面数据库运行时。
 * @param runtimeContributions - Optional runtime side effects (e.g. domain event subscriptions).
 *                               可选的运行时副作用（如领域事件订阅）。
 */
export function createTaskPowerSyncModule(
  db: IElectronDatabase,
  runtimeContributions?: TaskRuntimeContributionsInput,
): TaskModuleInstance {
  return createTaskModule({
    taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
    taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
    taskDependencyRepository: new PowerSyncTaskDependencyRepository(db),
    taskFolderRepository: new PowerSyncTaskFolderRepository(db),
    taskWriteTransactionRunner: new PowerSyncTaskWriteTransactionRunner(db),
    runtimeContributions,
  });
}

export function createTaskPowerSyncScheduleProjectionSource(
  db: TaskPowerSyncQueryable,
): TaskScheduleProjectionSource {
  return createTaskScheduleProjectionSource({
    taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
    taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
  });
}

export function createTaskPowerSyncScheduleExecutionSource(
  db: TaskPowerSyncQueryable,
): TaskScheduleExecutionSource {
  return createTaskScheduleExecutionSource({
    taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
    taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
  });
}

export {
  PowerSyncTaskTemplateRepository,
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskDependencyRepository,
  PowerSyncTaskFolderRepository,
};
