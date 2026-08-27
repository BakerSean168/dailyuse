/**
 * Legacy Reminder due-set shadow runtime.
 * 旧 Reminder due-set shadow 运行时。
 *
 * ROUTINE-3402 retires the old trigger cron from production composition. This
 * compatibility runtime wraps the now read-only shadow cron so diagnostics can
 * still be invoked explicitly during cutover/forensics. It is NOT a required
 * production capability and performs no reminder side effects.
 */

import {
  createReminderTriggerCronJob,
  type ReminderTriggerCronJobDependencies,
} from '../cron/reminder-trigger-cron-job';
import type { ReminderModuleRuntimeContribution } from '../reminder.module';

export function createReminderTriggerCronRuntime(
  deps: ReminderTriggerCronJobDependencies,
): ReminderModuleRuntimeContribution {
  const shadowJob = createReminderTriggerCronJob(deps);
  let started = false;

  return {
    start(): void {
      if (started) return;
      shadowJob.start();
      started = true;
    },

    stop(): void | Promise<void> {
      if (!started) return;
      started = false;
      return shadowJob.stop();
    },

    execute(): Promise<void> {
      return (shadowJob as Required<ReminderModuleRuntimeContribution>).execute();
    },
  };
}
