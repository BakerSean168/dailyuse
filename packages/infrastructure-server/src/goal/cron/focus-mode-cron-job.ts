import * as cron from 'node-cron';
import { FocusModeApplicationService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusModeCronJob');

/**
 * FocusMode Cron Job
 * 涓撴敞鍛ㄦ湡鑷姩杩囨湡璋冨害鍣?
 *
 * 鑱岃矗锛?
 * - 瀹氭椂妫€鏌ュ苟鑷姩澶辨晥杩囨湡鐨勪笓娉ㄥ懆鏈?
 * - Record鎵ц鏃ュ織
 * - 澶勭悊閿欒鎯呭喌
 *
 * 璋冨害棰戠巼锛氭瘡灏忔椂鎵ц涓€娆?(cron: '0 * * * *')
 * - 鍒嗛挓锛?锛堟瘡灏忔椂鐨勭 0 鍒嗛挓锛?
 * - 灏忔椂锛?锛堟瘡灏忔椂锛?
 * - 鏃ユ湡锛?锛堟瘡澶╋級
 * - 鏈堜唤锛?锛堟瘡鏈堬級
 * - 鏄熸湡锛?锛堟瘡鍛級
 *
 * 浣跨敤绀轰緥锛?
 * ```typescript
 * import { startFocusModeCronJob, stopFocusModeCronJob } from './focusModeCronJob';
 *
 * // 鍚姩璋冨害鍣?
 * startFocusModeCronJob();
 *
 * // 鍋滄璋冨害鍣?
 * stopFocusModeCronJob();
 * ```
 */

let cronTask: cron.ScheduledTask | null = null;
let focusModeService: FocusModeApplicationService | null = null;

/**
 * Get FocusModeApplicationService 鍗曚緥
 * 寤惰繜鍔犺浇锛岄伩鍏嶅惊鐜緷璧?
 */
async function getFocusModeService(): Promise<FocusModeApplicationService> {
  if (!focusModeService) {
    focusModeService = await FocusModeApplicationService.getInstance();
  }
  return focusModeService;
}

/**
 * 鎵ц鑷姩杩囨湡妫€鏌?
 * 鐢?cron 璋冨害鍣ㄥ畾鏃惰皟鐢?
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

    // 涓嶆姏鍑洪敊璇紝閬垮厤褰卞搷鍚庣画鐨勮皟搴︽墽琛?
  }
}

/**
 * 鍚姩 FocusMode Cron Job
 * 鍦ㄥ簲鐢ㄥ惎鍔ㄦ椂璋冪敤
 *
 * @returns cron.ScheduledTask 瀹炰緥
 */
export function startFocusModeCronJob(): cron.ScheduledTask {
  if (cronTask) {
    logger.warn('Focus mode cron job is already running');
    return cronTask;
  }

  logger.info('Starting focus mode cron job', {
    schedule: '0 * * * *', // 姣忓皬鏃舵墽琛屼竴娆?
    description: 'Check and deactivate expired focus modes',
  });

  // Create瀹氭椂浠诲姟锛氭瘡灏忔椂鎵ц涓€娆?
  cronTask = cron.schedule(
    '0 * * * *',
    () => {
      checkAndDeactivateExpiredFocusModes().catch((error) => {
        logger.error('Unhandled error in focus mode cron job', error);
      });
    },
    {
      timezone: 'Asia/Shanghai', // 浣跨敤涓浗鏃跺尯
    },
  );

  // 鍚姩浠诲姟
  cronTask.start();

  logger.info('Focus mode cron job started successfully');

  // 鍙€夛細搴旂敤鍚姩鏃剁珛鍗虫墽琛屼竴娆℃鏌?
  checkAndDeactivateExpiredFocusModes().catch((error) => {
    logger.error('Failed to run initial focus mode expiration check', error);
  });

  return cronTask;
}

/**
 * 鍋滄 FocusMode Cron Job
 * 鍦ㄥ簲鐢ㄥ叧闂椂璋冪敤
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
 * Get Cron Job 杩愯鐘舵€?
 *
 * @returns 鏄惁姝ｅ湪杩愯
 */
export function isFocusModeCronJobRunning(): boolean {
  return cronTask !== null;
}

/**
 * 鎵嬪姩瑙﹀彂涓€娆¤繃鏈熸鏌?
 * 鐢ㄤ簬娴嬭瘯鎴栫鐞嗗憳鎵嬪姩瑙﹀彂
 *
 * @returns 杩囨湡鐨勪笓娉ㄥ懆鏈熸暟閲?
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
