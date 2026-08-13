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

import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
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
import type { TaskScheduleExecutionSource } from '../../schedule-execution';
import type { TaskScheduleProjectionSource } from '../../schedule-projection';
import type { TaskRepositorySet } from './prisma';

type TaskPowerSyncQueryable = IElectronDatabaseTransaction;

/**
 * Creates a task module instance with PowerSync adapters.
 * 使用 PowerSync 适配器创建任务模块实例。
 *
 * Convenience root kept for in-package reuse / rollback; delegates to
 * createTaskPowerSyncRepositories() plus the canonical module assembly.
 *
 * 便捷组合根，保留用于包内复用与回滚；委托给
 * createTaskPowerSyncRepositories() 与规范化模块装配。
 *
 * @param db - PowerSync desktop database runtime. PowerSync 桌面数据库运行时。
 * @param runtimeContributions - Optional runtime side effects (e.g. domain event subscriptions).
 *                               可选的运行时副作用（如领域事件订阅）。
 * @returns TaskModuleInstance with PowerSync-backed repositories attached.
 *          返回挂载 PowerSync 仓储的任务模块实例。
 */
export function createTaskPowerSyncModule(
  db: IElectronDatabase,
  runtimeContributions?: TaskRuntimeContributionsInput,
): TaskModuleInstance {
  const {
    taskTemplateRepository,
    taskInstanceRepository,
    taskDependencyRepository,
    taskFolderRepository,
    taskWriteTransactionRunner,
  } = createTaskPowerSyncRepositories(db);

  return createTaskModule({
    taskTemplateRepository,
    taskInstanceRepository,
    taskDependencyRepository,
    taskFolderRepository,
    taskWriteTransactionRunner,
    runtimeContributions,
  });
}

/**
 * Creates PowerSync-backed task repositories.
 * 创建基于 PowerSync 的任务仓储。
 *
 * Electron counterpart of createTaskPrismaRepositories(): selects the PowerSync
 * adapters and returns the same repository Port shape, so the transport-neutral
 * createTaskModule() is host-agnostic.
 *
 * 与 createTaskPrismaRepositories() 对应的 Electron 版本：选择 PowerSync 适配器并返回
 * 相同的仓储 Port 形状，从而让 transport-neutral 的 createTaskModule() 与宿主技术无关。
 *
 * @param db - Electron database adapter owned by the desktop main runtime. 桌面主进程持有的 Electron 数据库适配器。
 * @returns Repository set backed by the PowerSync adapters. 基于 PowerSync 适配器的仓储集合。
 */
export function createTaskPowerSyncRepositories(db: IElectronDatabase): TaskRepositorySet {
  return {
    taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
    taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
    taskDependencyRepository: new PowerSyncTaskDependencyRepository(db),
    taskFolderRepository: new PowerSyncTaskFolderRepository(db),
    taskWriteTransactionRunner: new PowerSyncTaskWriteTransactionRunner(db),
  };
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
