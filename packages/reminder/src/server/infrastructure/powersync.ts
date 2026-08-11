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
import type { IElectronDatabase } from '@memoflow/contracts/electron';

type Queryable = IElectronDatabase;

/**
 * Creates a ReminderModuleInstance backed by PowerSync repositories.
 * 创建一个由 PowerSync 仓储驱动的 ReminderModuleInstance。
 */

/**
 * Desktop PowerSync closure gate: fails closed when (a) the local Account row is
 * missing / not Active, or (b) a local closure-request marker exists — i.e. the
 * user initiated cloud close and the remote saga is in requested/revoking while
 * the remote Account row is still Active. Blocks local new-work entrypoints
 * (AI / scheduler / use-cases) the moment the close request starts.
 */
export function createPowerSyncClosureChecker(db: Queryable): (identityId: string) => Promise<boolean> {
  return async (identityId: string): Promise<boolean> => {
    try {
      const row = await db.getOptional<{ status: string }>(
        'SELECT status FROM accounts WHERE id = ? LIMIT 1',
        [identityId],
      );
      if (!row || row.status !== 'Active') {
        return true;
      }
      const marker = await db.getOptional<{ identity_id: string }>(
        'SELECT identity_id FROM account_closure_requested WHERE identity_id = ? LIMIT 1',
        [identityId],
      );
      return marker !== null;
    } catch {
      return true; // fail-closed on query failure
    }
  };
}

export function createReminderPowerSyncModule(
  db: Queryable,
  runtimeContributions?: ReminderRuntimeContributionsInput,
): ReminderModuleInstance {
  const reminderTemplateRepository = new ReminderTemplatePowerSyncRepository(db);
  const reminderGroupRepository = new ReminderGroupPowerSyncRepository(db);
  const closureChecker = createPowerSyncClosureChecker(db);
  return createReminderModule({
    reminderTemplateRepository,
    reminderGroupRepository,
    reminderResponseRepository: new ReminderResponsePowerSyncRepository(db),
    userReminderPreferenceRepository: new UserReminderPreferencePowerSyncRepository(db),
    runtimeContributions,
    closureChecker,
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
