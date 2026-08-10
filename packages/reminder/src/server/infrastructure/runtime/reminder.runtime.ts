/**
 * Reminder runtime contributions for server transports.
 * 提醒模块服务端传输层的运行时贡献。
 *
 * Enforces W0 Fail-Fast capability contracts:
 * In production/development, scheduler lane capability MUST be configured.
 * Implicit fallback or no-op success without capability is strictly forbidden.
 */

import {
  assertProductionCapabilityOrFailFast,
  type CapabilityRequirementContract,
} from '@memoflow/contracts/reliable-messaging';
import type { ReminderModuleRuntimeContribution } from '../reminder.module';

export interface CreateReminderRuntimeContributionOptions {
  readonly enabled?: boolean;
  readonly environment?: 'production' | 'development' | 'test';
  readonly cronContribution?: ReminderModuleRuntimeContribution;
}

/**
 * Creates an instance-owned runtime contribution for the reminder module.
 * Checks scheduler lane capability and fails fast if missing in production.
 */
export function createReminderRuntimeContribution(
  options: CreateReminderRuntimeContributionOptions = {},
): ReminderModuleRuntimeContribution {
  const env =
    options.environment ??
    ((process.env.NODE_ENV as 'production' | 'development' | 'test') || 'development');
  const isEnabled =
    options.enabled ??
    (process.env.REMINDER_SCHEDULER_LANE_ENABLED !== 'false' &&
      process.env.REMINDER_SCHEDULER_ENABLED !== 'false');

  const contract: CapabilityRequirementContract = {
    schemaVersion: 1,
    capabilityName: 'reminder.cron.scheduler',
    moduleName: 'reminder',
    status: isEnabled && options.cronContribution ? 'available' : 'missing',
    requiredInProduction: true,
    allowTestDoubleInTest: true,
    description: 'Reminder cron scheduler runtime capability',
  };

  assertProductionCapabilityOrFailFast(contract, env);

  if (options.cronContribution) {
    return options.cronContribution;
  }

  return {
    start(): void {
      throw new Error(
        '[REMINDER_RUNTIME] Scheduler runtime capability missing: cronContribution was not injected.',
      );
    },
    stop(): void {},
  };
}
