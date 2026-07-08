/**
 * Reminder runtime contributions for server transports.
 * 提醒模块服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * The API module now wires the real cron contribution from
 * `server/infrastructure/cron/reminder-trigger-cron-job.ts`.
 *
 * 这个文件让副作用显式且可逆。
 * 目前仅为占位实现 — start/stop 只记录生命周期转换日志。
 *
 * @todo Implement cron job scheduling for recurring reminders.
 * @todo Add event subscription wiring (e.g. response streaks, frequency re-analysis).
 */

import type { ReminderModuleRuntimeContribution } from '../reminder.module';

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type ReminderRuntimeContribution = ReminderModuleRuntimeContribution;

/**
 * Creates an instance-owned runtime contribution for the reminder module.
 * 创建提醒模块的实例级 runtime 贡献对象。
 *
 * This helper is retained only as a thin type alias wrapper.
 * Real runtime work should come from concrete contributions such as
 * `createReminderTriggerCronJob(...)`.
 *
 * 此辅助仅保留为轻量类型包装。
 * 真正的运行时工作应来自 `createReminderTriggerCronJob(...)` 等具体贡献。
 */
export function createReminderRuntimeContribution(): ReminderRuntimeContribution {
  return {
    start(): void {},
    stop(): void {},
  };
}
