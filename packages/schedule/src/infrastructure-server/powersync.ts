/**
 * createSchedulePowerSyncModule — PowerSync composition root for Electron / offline-first.
 * createSchedulePowerSyncModule —— 面向 Electron / 离线优先的 PowerSync 组合根。
 *
 * Mirrors createScheduleModule but wires PowerSync repository adapters.
 * 结构与 createScheduleModule 完全对齐，但使用 PowerSync 仓储适配器。
 */

import {
  createScheduleModule,
  type ScheduleModuleInstance,
  type ScheduleModuleRuntimeContribution,
} from './schedule.module';
import { PowerSyncScheduleRepository } from './adapters/powersync/schedule-powersync.repository';
import { PowerSyncScheduleExecutionRepository } from './adapters/powersync/schedule-execution-powersync.repository';
import { PowerSyncScheduleTaskRepository } from './adapters/powersync/schedule-task-powersync.repository';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

/**
 * Creates a schedule module instance with PowerSync adapters.
 * 使用 PowerSync 适配器创建调度模块实例。
 */
export function createSchedulePowerSyncModule(
  dbConnection: Queryable,
  runtimeContributions?:
    | ScheduleModuleRuntimeContribution
    | readonly ScheduleModuleRuntimeContribution[],
): ScheduleModuleInstance {
  return createScheduleModule({
    scheduleRepository: new PowerSyncScheduleRepository(dbConnection),
    scheduleExecutionRepository: new PowerSyncScheduleExecutionRepository(dbConnection),
    scheduleTaskRepository: new PowerSyncScheduleTaskRepository(dbConnection),
    runtimeContributions,
  });
}

export {
  PowerSyncScheduleRepository,
  PowerSyncScheduleExecutionRepository,
  PowerSyncScheduleTaskRepository,
};
