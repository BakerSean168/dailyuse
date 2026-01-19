import * as cron from 'node-cron';
import { FocusModeApplicationService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusModeCronJob');

/**
 * FocusMode Cron Job
 * 专注周期自动过期调度器
 *
 * 职责：
 * - 定时检查并自动失效过期的专注周期
 * - 记录执行日志
 * - 处理错误情况
 *
 * 调度频率：每小时执行一次 (cron: '0 * * * *')
 * - 分钟：0（每小时的第 0 分钟）
 * - 小时：*（每小时）
 * - 日期：*（每天）
 * - 月份：*（每月）
 * - 星期：*（每周）
 *
 * 使用示例：
 * ```typescript
 * import { startFocusModeCronJob, stopFocusModeCronJob } from './focusModeCronJob';
 *
 * // 启动调度器
 * startFocusModeCronJob();
 *
 * // 停止调度器
 * stopFocusModeCronJob();
 * ```
 */

let cronTask: cron.ScheduledTask | null = null;
let focusModeService: FocusModeApplicationService | null = null;

/**
 * 获取 FocusModeApplicationService 单例
 * 延迟加载，避免循环依赖
 */
async function getFocusModeService(): Promise<FocusModeApplicationService> {
  if (!focusModeService) {
    focusModeService = await FocusModeApplicationService.getInstance();
  }
  return focusModeService;
}

/**
 * 执行自动过期检查
 * 由 cron 调度器定时调用
 */
async function checkAndDeactivateExpiredFocusModes(): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting focus mode expiration check');

  try {
    const service = await getFocusModeService();
    const expiredCount = await service.checkAndDeactivateExpired();

    const duration = Date.now() - startTime;

    if (expiredCount > 0) {
      logger.info('Focus mode expiration check completed', {
        expiredCount,
        durationMs: duration,
      });
    } else {
      logger.debug('No expired focus modes found', {
        durationMs: duration,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to check and deactivate expired focus modes', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    // 不抛出错误，避免影响后续的调度执行
  }
}

/**
 * 启动 FocusMode Cron Job
 * 在应用启动时调用
 *
 * @returns cron.ScheduledTask 实例
 */
export function startFocusModeCronJob(): cron.ScheduledTask {
  if (cronTask) {
    logger.warn('Focus mode cron job is already running');
    return cronTask;
  }

  logger.info('Starting focus mode cron job', {
    schedule: '0 * * * *', // 每小时执行一次
    description: 'Check and deactivate expired focus modes',
  });

  // 创建定时任务：每小时执行一次
  cronTask = cron.schedule(
    '0 * * * *',
    () => {
      checkAndDeactivateExpiredFocusModes().catch((error) => {
        logger.error('Unhandled error in focus mode cron job', error);
      });
    },
    {
      timezone: 'Asia/Shanghai', // 使用中国时区
    },
  );

  // 启动任务
  cronTask.start();

  logger.info('Focus mode cron job started successfully');

  // 可选：应用启动时立即执行一次检查
  checkAndDeactivateExpiredFocusModes().catch((error) => {
    logger.error('Failed to run initial focus mode expiration check', error);
  });

  return cronTask;
}

/**
 * 停止 FocusMode Cron Job
 * 在应用关闭时调用
 */
export function stopFocusModeCronJob(): void {
  if (!cronTask) {
    logger.warn('Focus mode cron job is not running');
    return;
  }

  logger.info('Stopping focus mode cron job');
  cronTask.stop();
  cronTask = null;
  logger.info('Focus mode cron job stopped successfully');
}

/**
 * 获取 Cron Job 运行状态
 *
 * @returns 是否正在运行
 */
export function isFocusModeCronJobRunning(): boolean {
  return cronTask !== null;
}

/**
 * 手动触发一次过期检查
 * 用于测试或管理员手动触发
 *
 * @returns 过期的专注周期数量
 */
export async function manualCheckExpiredFocusModes(): Promise<number> {
  logger.info('Manual focus mode expiration check triggered');

  try {
    const service = await getFocusModeService();
    const expiredCount = await service.checkAndDeactivateExpired();

    logger.info('Manual focus mode expiration check completed', {
      expiredCount,
    });

    return expiredCount;
  } catch (error) {
    logger.error('Failed to manually check expired focus modes', error);
    throw error;
  }
}
