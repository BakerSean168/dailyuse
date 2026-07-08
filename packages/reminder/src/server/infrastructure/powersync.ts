/**
 * Reminder PowerSync Module Factory.
 * 提醒模块 PowerSync 工厂。
 *
 * Thin factory that selects PowerSync repository adapters and delegates
 * to the shared composition root.
 *
 * 精简的工厂函数，选择 PowerSync 仓储适配器并委托给共享的组合根。
 */

import {
  createReminderModule,
  type ReminderModuleInstance,
  type ReminderRuntimeContributionsInput,
} from './reminder.module';
import { createReminderScheduleExecutionSource } from './schedule-execution-source';
import { createReminderScheduleProjectionSource } from './schedule-projection-source';
import {
  ReminderTemplatePowerSyncRepository,
  ReminderGroupPowerSyncRepository,
  ReminderResponsePowerSyncRepository,
  UserReminderPreferencePowerSyncRepository,
} from './adapters/powersync';
import type { ReminderScheduleExecutionSource } from '../../schedule-execution';
import type { ReminderScheduleProjectionSource } from '../../schedule-projection';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

/**
 * Creates a ReminderModuleInstance backed by PowerSync repositories.
 * 创建一个由 PowerSync 仓储驱动的 ReminderModuleInstance。
 */
export function createReminderPowerSyncModule(
  db: Queryable,
  runtimeContributions?: ReminderRuntimeContributionsInput,
): ReminderModuleInstance {
  const reminderTemplateRepository = new ReminderTemplatePowerSyncRepository(db);
  const reminderGroupRepository = new ReminderGroupPowerSyncRepository(db);
  return createReminderModule({
    reminderTemplateRepository,
    reminderGroupRepository,
    reminderResponseRepository: new ReminderResponsePowerSyncRepository(db),
    userReminderPreferenceRepository: new UserReminderPreferencePowerSyncRepository(db),
    runtimeContributions,
  });
}

export function createReminderPowerSyncScheduleProjectionSource(
  db: Queryable,
): ReminderScheduleProjectionSource {
  return createReminderScheduleProjectionSource({
    reminderTemplateRepository: new ReminderTemplatePowerSyncRepository(db),
  });
}

export function createReminderPowerSyncScheduleExecutionSource(
  db: Queryable,
): ReminderScheduleExecutionSource {
  return createReminderScheduleExecutionSource({
    reminderTemplateRepository: new ReminderTemplatePowerSyncRepository(db),
  });
}

export {
  ReminderTemplatePowerSyncRepository,
  ReminderGroupPowerSyncRepository,
  ReminderResponsePowerSyncRepository,
  UserReminderPreferencePowerSyncRepository,
};
