/**
 * Reminder trigger cron runtime — module-owned runtime contribution.
 * 提醒触发定时任务运行时 —— 模块自有运行时贡献。
 *
 * Wraps `createReminderTriggerCronJob` (the merge-base API composition wired it
 * inside the transport register) into an idempotent, module-owned contribution
 * so BOTH the API and any host that supplies the Prisma reliable/transaction
 * ports can attach the every-minute reminder trigger scan to
 * `createReminderModule({ runtimeContributions })`. `start()`/`stop()` are
 * idempotent so re-entrant module start/dispose never double-schedules the cron.
 *
 * 把 `createReminderTriggerCronJob`（merge-base 的 API 组合曾把它接在 transport
 * register 内部）包装成幂等的模块自有贡献，使 API 以及任何持有 Prisma
 * reliable/transaction ports 的宿主都能把每分钟提醒触发扫描挂到
 * `createReminderModule({ runtimeContributions })` 上。`start()`/`stop()` 幂等，
 * 因此重入的模块 start/dispose 绝不会重复调度 cron。
 *
 * The production fail-fast capability assertion from `createReminderRuntimeContribution`
 * is preserved (merge-base behavior): in production the cron must be actually wired,
 * otherwise startup fails closed.
 *
 * 保留 `createReminderRuntimeContribution` 的生产 fail-fast 能力断言（merge-base 行为）：
 * 生产环境下 cron 必须真正接好，否则启动 fail-closed。
 */

import { createReminderTriggerCronJob, type ReminderTriggerCronJobDependencies } from '../cron/reminder-trigger-cron-job';
import type { ReminderModuleRuntimeContribution } from '../reminder.module';
import { createReminderRuntimeContribution } from './reminder.runtime';

/**
 * Creates the idempotent reminder trigger cron runtime contribution.
 * 创建幂等的提醒触发定时任务运行时贡献。
 *
 * @param deps - Same dependencies as the underlying cron job factory.
 *               与底层 cron 工厂相同的依赖。
 * @returns A module-owned runtime contribution wired to the every-minute scan.
 *          返回接线到每分钟扫描的模块自有运行时贡献。
 */
export function createReminderTriggerCronRuntime(
  deps: ReminderTriggerCronJobDependencies,
): ReminderModuleRuntimeContribution {
  const cronJob = createReminderTriggerCronJob(deps);
  const contribution = createReminderRuntimeContribution({ cronContribution: cronJob });
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }
      contribution.start();
      started = true;
    },

    stop(): void | Promise<void> {
      if (!started) {
        return;
      }
      started = false;
      return contribution.stop();
    },

    execute(): Promise<void> {
      // The underlying cron job always exposes `execute` (the optional flag on
      // the module contribution type is a union accommodation). 底层 cron job
      // 总是暴露 `execute`（模块贡献类型上的可选标记只是联合类型容差）。
      return (cronJob as Required<ReminderModuleRuntimeContribution>).execute();
    },
  };
}
