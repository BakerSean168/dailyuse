/**
 * @file registerCronJobs.ts
 * @description 注册所有 Cron Jobs，管理定时任务的生命周期。
 * @date 2025-01-22
 */

import { CronSchedulerManager } from './cron-scheduler-manager';
// import { DailyAnalysisCronJob } from '@/modules/reminder/infrastructure/cron/dailyAnalysisCronJob';
import { createLogger } from '@dailyuse/utils';
import { env } from '@/shared/infrastructure/config/env.js';
import { rebuildAllProfileSnapshots } from './jobs/snapshot-rebuild.job.js';

const logger = createLogger('CronJobRegistration');

/**
 * 注册所有 Cron Jobs。
 *
 * @remarks
 * 在应用启动时调用，将所有预定义的定时任务注册到调度器中。
 */
export function registerAllCronJobs(): void {
  logger.info('Registering all cron jobs...');

  const scheduler = CronSchedulerManager.getInstance();

  // ===== Reminder Module Jobs =====

  /**
   * 每日分析任务。
   * 
   * 每天凌晨 2:00 执行，分析提醒模板的效果并自动调整频率。
   */
  // TODO: DailyAnalysisCronJob 文件缺失，待重构后恢复
  // scheduler.register({
  //   name: 'reminder:daily-analysis',
  //   schedule: '0 2 * * *', // 每天凌晨 2:00
  //   task: async () => {
  //     const job = new DailyAnalysisCronJob();
  //     await job.execute();
  //   },
  //   enabled: env.ENABLE_DAILY_ANALYSIS,
  //   timezone: env.TZ,
  // });

  // ===== Snapshot Rebuild Job =====

  const snapshotRootDir = env.POWERSYNC_SNAPSHOT_DIR;
  if (snapshotRootDir) {
    scheduler.register({
      name: 'powersync:snapshot-rebuild',
      schedule: env.SNAPSHOT_REBUILD_SCHEDULE,
      task: () => rebuildAllProfileSnapshots(snapshotRootDir),
      enabled: env.SNAPSHOT_REBUILD_ENABLED,
      timezone: env.TZ,
    });
  }

  // ===== 未来可以在这里添加更多 Jobs =====

  // 示例: Schedule Module Jobs
  // scheduler.register({
  //   name: 'schedule:cleanup-expired',
  //   schedule: '0 3 * * *', // 每天凌晨 3:00
  //   task: async () => {
  //     // 清理过期的 Schedule 记录
  //   },
  //   enabled: true,
  // });

  const status = scheduler.getStatus();
  logger.info('All cron jobs registered', {
    totalJobs: status.length,
    jobs: status.map((j) => `${j.name} (${j.schedule})`),
  });
}

/**
 * 启动 Cron 调度器。
 *
 * @remarks
 * 在应用完全启动后调用，开始执行所有已注册且启用的任务。
 */
export function startCronScheduler(): void {
  const scheduler = CronSchedulerManager.getInstance();
  scheduler.start();

  logger.info('Cron scheduler started', {
    status: scheduler.getStatus(),
  });
}

/**
 * 停止 Cron 调度器。
 *
 * @remarks
 * 在应用关闭时调用，停止所有定时任务。
 */
export function stopCronScheduler(): void {
  const scheduler = CronSchedulerManager.getInstance();
  scheduler.stop();

  logger.info('Cron scheduler stopped');
}
