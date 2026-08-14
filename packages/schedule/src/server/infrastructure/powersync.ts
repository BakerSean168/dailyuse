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
import { createScheduleLeasePowerSyncRepository } from './lease/schedule-lease.repository';
import { ScheduleLeaseCoordinator } from './lease/schedule-lease-coordinator';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type { IScheduleLeaseRepository } from '../application/ports/schedule-lease.port';
import type {
  IScheduleRepository,
  IScheduleExecutionRepository,
  IScheduleTaskRepository,
} from '../domain';

type Queryable = IElectronDatabase;

/**
 * Host-facing schedule repository set for the PowerSync lane.
 * 面向宿主暴露的 PowerSync lane 调度仓储集合。
 *
 * Contains the three schedule repositories plus the lease coordinator and the
 * lease repository. Field names for the three repositories are preserved for
 * existing consumers; the lease ingredients complete the set so the Electron
 * lane can drive two-phase host assembly.
 *
 * 包含三个调度仓储，以及 lease coordinator 与 lease repository。三个仓储字段名
 * 为既有消费者保留；lease 原料补全集合，使 Electron lane 可驱动两阶段宿主装配。
 */
export interface SchedulePowerSyncRepositories {
  readonly scheduleRepository: IScheduleRepository;
  readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly leaseCoordinator: ScheduleLeaseCoordinator;
  readonly leaseRepository: IScheduleLeaseRepository;
}

export function createSchedulePowerSyncRepositories(
  dbConnection: Queryable,
): SchedulePowerSyncRepositories {
  const leaseRepository = createScheduleLeasePowerSyncRepository(dbConnection);
  return {
    scheduleRepository: new PowerSyncScheduleRepository(dbConnection),
    scheduleExecutionRepository: new PowerSyncScheduleExecutionRepository(dbConnection),
    scheduleTaskRepository: new PowerSyncScheduleTaskRepository(dbConnection),
    leaseCoordinator: new ScheduleLeaseCoordinator(leaseRepository),
    leaseRepository,
  };
}

/**
 * Creates a schedule module instance with PowerSync adapters.
 * 使用 PowerSync 适配器创建调度模块实例。
 *
 * Convenience root kept for in-package reuse / rollback; delegates to
 * createSchedulePowerSyncRepositories() plus the canonical module assembly.
 *
 * 便捷组合根，保留用于包内复用与回滚；委托给
 * createSchedulePowerSyncRepositories() 与规范化模块装配。
 *
 * @param dbConnection - Electron database adapter owned by the desktop main runtime. 桌面主进程持有的 Electron 数据库适配器。
 * @param runtimeContributions - Optional runtime side effects. 可选的运行时副作用。
 * @param leaseCoordinatorInput - Optional host-provided lease coordinator; defaults to the set's own. 可选的宿主持有 lease coordinator；默认使用集合自有的。
 * @returns ScheduleModuleInstance with PowerSync-backed repositories attached.
 *          返回挂载 PowerSync 仓储的调度模块实例。
 */
export function createSchedulePowerSyncModule(
  dbConnection: Queryable,
  runtimeContributions?:
    | ScheduleModuleRuntimeContribution
    | readonly ScheduleModuleRuntimeContribution[],
  leaseCoordinatorInput?: ScheduleLeaseCoordinator,
): ScheduleModuleInstance {
  const repositories = createSchedulePowerSyncRepositories(dbConnection);
  const leaseCoordinator =
    leaseCoordinatorInput ?? repositories.leaseCoordinator;

  return createScheduleModule({
    scheduleRepository: repositories.scheduleRepository,
    scheduleExecutionRepository: repositories.scheduleExecutionRepository,
    scheduleTaskRepository: repositories.scheduleTaskRepository,
    leaseCoordinator,
    runtimeContributions,
  });
}

export {
  PowerSyncScheduleRepository,
  PowerSyncScheduleExecutionRepository,
  PowerSyncScheduleTaskRepository,
};
