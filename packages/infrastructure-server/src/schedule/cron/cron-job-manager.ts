/**
 * CronJobManager - Cron 浠诲姟绠＄悊鍣?
 *
 * @responsibility
 * - 绠＄悊All鏈?ScheduleTask 鐨?Cron 浠诲姟
 * - 鏀寔鍔ㄦ€佹敞鍐?娉ㄩ攢 Cron 浠诲姟
 * - 瑙﹀彂鏃惰皟鐢?ScheduleTaskExecutor 鎵ц浠诲姟
 *
 * @architecture
 * - 鍩虹璁炬柦灞傦紙Infrastructure锛?
 * - 浣跨敤 node-cron 绠＄悊瀹氭椂浠诲姟
 * - 鍐呭瓨涓淮鎶?taskUuid 鈫?CronJob 鏄犲皠
 */

import cron from 'node-cron';
import { createLogger } from '@dailyuse/utils';
import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import { ScheduleTaskExecutor } from '@dailyuse/application-server';
import { ScheduleMonitor } from '../monitoring/ScheduleMonitor';

const logger = createLogger('CronJobManager');

type CronJob = ReturnType<typeof cron.schedule>;

export class CronJobManager {
  private static instance: CronJobManager;

  /** taskUuid 鈫?CronJob 鏄犲皠琛?*/
  private jobs: Map<string, CronJob> = new Map();

  /** taskUuid 鈫?cron 琛ㄨ揪寮忔槧灏勮〃锛堢敤浜庤皟璇曪級 */
  private cronExpressions: Map<string, string> = new Map();

  private executor: ScheduleTaskExecutor;
  private monitor: ScheduleMonitor;

  private constructor() {
    this.executor = ScheduleTaskExecutor.getInstance();
    this.monitor = ScheduleMonitor.getInstance();
  }

  public static getInstance(): CronJobManager {
    if (!CronJobManager.instance) {
      CronJobManager.instance = new CronJobManager();
    }
    return CronJobManager.instance;
  }

  /**
   * 娉ㄥ唽浠诲姟鐨?Cron Job
   *
   * @param task - ScheduleTask 鑱氬悎鏍?
   * @returns 鏄惁鎴愬姛娉ㄥ唽
   */
  public registerTask(task: ScheduleTask): boolean {
    const taskUuid = task.uuid;
    const cronExpression = task.schedule.cronExpression;

    if (!cronExpression) {
      logger.warn('鈿狅笍 浠诲姟娌℃湁 cron 琛ㄨ揪寮忥紝璺宠繃娉ㄥ唽', {
        taskUuid,
        taskName: task.name,
      });
      return false;
    }

    // 濡傛灉浠诲姟宸茬粡娉ㄥ唽锛屽厛娉ㄩ攢
    if (this.jobs.has(taskUuid)) {
      this.unregisterTask(taskUuid);
    }

    try {
      // 楠岃瘉 cron 琛ㄨ揪寮?
      if (!cron.validate(cronExpression)) {
        logger.error('鉂?鏃犳晥鐨?cron 琛ㄨ揪寮?, {
          taskUuid,
          cronExpression,
        });
        return false;
      }

      // Create Cron Job
      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info('鈴?Cron 瑙﹀彂', {
            taskUuid,
            taskName: task.name,
            cronExpression,
            triggeredAt: new Date().toISOString(),
          });

          try {
            await this.executor!.executeTaskByUuid(taskUuid);
          } catch (error) {
            logger.error('鉂?Cron 鎵ц浠诲姟澶辫触', {
              taskUuid,
              error,
            });
          }
        },
        {
          timezone: task.schedule.timezone || 'Asia/Shanghai',
        },
      );

      // 鏍规嵁鐘舵€佸喅瀹氭槸鍚﹀惎鍔?
      // 鍙湁 ACTIVE 鐘舵€佷笖 enabled=true 鐨勪换鍔℃墠鍚姩
      if (task.isActive() && task.enabled) {
        job.start();
        logger.info('鉁?浠诲姟娉ㄥ唽骞跺惎鍔ㄦ垚鍔?, {
          taskUuid,
          taskName: task.name,
          cronExpression,
          timezone: task.schedule.timezone,
          status: task.status,
        });
      } else {
        // 浠诲姟宸叉敞鍐屼絾鏈惎鍔紙鏆傚仠鐘舵€侊級
        logger.info('鈴革笍 浠诲姟宸叉敞鍐屼絾鏈惎鍔紙鏆傚仠鎴栫鐢級', {
          taskUuid,
          taskName: task.name,
          status: task.status,
          enabled: task.enabled,
        });
      }

      // Save鍒版槧灏勮〃
      this.jobs.set(taskUuid, job);
      this.cronExpressions.set(taskUuid, cronExpression);

      return true;
    } catch (error) {
      logger.error('鉂?娉ㄥ唽浠诲姟澶辫触', {
        taskUuid,
        cronExpression,
        error,
      });
      return false;
    }
  }

  /**
   * 娉ㄩ攢浠诲姟鐨?Cron Job
   *
   * @param taskUuid - 浠诲姟 UUID
   * @returns 鏄惁鎴愬姛娉ㄩ攢
   */
  public unregisterTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('鈿狅笍 浠诲姟鏈敞鍐岋紝鏃犳硶娉ㄩ攢', { taskUuid });
      return false;
    }

    try {
      job.stop();
      this.jobs.delete(taskUuid);
      this.cronExpressions.delete(taskUuid);

      logger.info('鉁?浠诲姟娉ㄩ攢鎴愬姛', { taskUuid });
      return true;
    } catch (error) {
      logger.error('鉂?娉ㄩ攢浠诲姟澶辫触', { taskUuid, error });
      return false;
    }
  }

  /**
   * 鍚姩浠诲姟鐨?Cron Job
   */
  public startTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('鈿狅笍 浠诲姟鏈敞鍐岋紝鏃犳硶鍚姩', { taskUuid });
      return false;
    }

    job.start();
    logger.info('鈻讹笍 浠诲姟宸插惎鍔?, { taskUuid });
    return true;
  }

  /**
   * 鍋滄浠诲姟鐨?Cron Job
   */
  public stopTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('鈿狅笍 浠诲姟鏈敞鍐岋紝鏃犳硶鍋滄', { taskUuid });
      return false;
    }

    job.stop();
    logger.info('鈴革笍 浠诲姟宸插仠姝?, { taskUuid });
    return true;
  }

  /**
   * Update浠诲姟锛堥噸鏂版敞鍐岋級
   */
  public async updateTask(task: ScheduleTask): Promise<boolean> {
    this.unregisterTask(task.uuid);
    return await this.registerTask(task);
  }

  /**
   * GetAll鏈夊凡娉ㄥ唽浠诲姟鐨勭粺璁′俊鎭?
   */
  public getStats(): {
    totalJobs: number;
    registeredTasks: string[];
    cronExpressions: Record<string, string>;
  } {
    return {
      totalJobs: this.jobs.size,
      registeredTasks: Array.from(this.jobs.keys()),
      cronExpressions: Object.fromEntries(this.cronExpressions),
    };
  }

  /**
   * Get褰撳墠娉ㄥ唽鐨勬墍鏈変换鍔′俊鎭?
   */
  public getRegisteredTasks(): Array<{
    taskUuid: string;
    cronExpression: string;
    isRunning: boolean;
  }> {
    return Array.from(this.jobs.entries()).map(([taskUuid, job]) => ({
      taskUuid,
      cronExpression: this.cronExpressions.get(taskUuid) || 'unknown',
      isRunning: job ? true : false,
    }));
  }

  /**
   * 鎵撳嵃 Cron 浠诲姟鐩戞帶鎶ュ憡
   */
  public printCronMonitorReport(): void {
    const registeredTasks = this.getRegisteredTasks();
    const runningCount = registeredTasks.filter((t) => t.isRunning).length;

    logger.info('馃搵 CronJobManager 鐩戞帶鎶ュ憡', {
      宸叉敞鍐屼换鍔℃€绘暟: registeredTasks.length,
      杩愯涓换鍔? runningCount,
      鍋滄浠诲姟: registeredTasks.length - runningCount,
    });

    if (registeredTasks.length > 0) {
      logger.info('浠诲姟List:', {
        tasks: registeredTasks.map((t) => ({
          taskUuid: t.taskUuid,
          cron琛ㄨ揪寮? t.cronExpression,
          鐘舵€? t.isRunning ? '杩愯涓? : '宸插仠姝?,
        })),
      });
    }

    // 鎵撳嵃鎵ц缁熻
    this.monitor.printMonitorReport();
  }

  /**
   * 鍋滄All鏈変换鍔?
   */
  public stopAll(): void {
    for (const [taskUuid, job] of this.jobs.entries()) {
      job.stop();
      logger.info('鈴革笍 浠诲姟宸插仠姝?, { taskUuid });
    }
  }

  /**
   * 娓呯┖All鏈変换鍔?
   */
  public clear(): void {
    this.stopAll();
    this.jobs.clear();
    this.cronExpressions.clear();
    logger.info('馃棏锔?All鏈変换鍔″凡娓呯┖');
  }
}
