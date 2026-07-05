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
} from './adapters/powersync';
import {
  createTaskScheduleProjectionSource,
} from './schedule-projection-source';
import { createTaskScheduleExecutionSource } from './schedule-execution-source';
import type { TaskScheduleExecutionSource } from '../schedule-execution';
import type { TaskScheduleProjectionSource } from '../schedule-projection';

/**
 * Minimal queryable interface compatible with PowerSync / IElectronDatabase.
 * PowerSync / IElectronDatabase 兼容的最小查询接口。
 */
type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

/**
 * Creates a task module instance with PowerSync adapters.
 * 使用 PowerSync 适配器创建任务模块实例。
 *
 * @param db - PowerSync queryable database connection. PowerSync 可查询数据库连接。
 * @param runtimeContributions - Optional runtime side effects (e.g. domain event subscriptions).
 *                               可选的运行时副作用（如领域事件订阅）。
 */
export function createTaskPowerSyncModule(
  db: Queryable,
  runtimeContributions?: TaskRuntimeContributionsInput,
): TaskModuleInstance {
  return createTaskModule({
    taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
    taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
    taskDependencyRepository: new PowerSyncTaskDependencyRepository(db),
    taskFolderRepository: new PowerSyncTaskFolderRepository(db),
    runtimeContributions,
  });
}

export function createTaskPowerSyncScheduleProjectionSource(
  db: Queryable,
): TaskScheduleProjectionSource {
  return createTaskScheduleProjectionSource({
    taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
    taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
  });
}

export function createTaskPowerSyncScheduleExecutionSource(
  db: Queryable,
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
