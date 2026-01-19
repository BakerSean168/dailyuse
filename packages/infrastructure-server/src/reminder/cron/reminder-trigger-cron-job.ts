// @ts-nocheck
/**
 * Reminder Trigger Cron Job
 * 
 * 职责：
 * - 每分钟扫描需要触发的提醒模板
 * - 调用 ReminderSchedulerService 执行触发逻辑
 * - 记录触发历史
 * - 更新下次触发时间
 * 
 * 触发频率：每分钟执行一次
 * Cron Expression: '* * * * *'
 */

import * as cron from 'node-cron';
import { ReminderContainer } from '../di/ReminderContainer';
import { ReminderSchedulerService, ReminderTriggerService } from '@dailyuse/domain-server/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderTriggerCronJob');

class ReminderTriggerCronJob {
  private static instance: ReminderTriggerCronJob | null = null;
  private cronTask: cron.ScheduledTask | null = null;
  private isRunning = false;
  private schedulerService: ReminderSchedulerService | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static async getInstance(): Promise<ReminderTriggerCronJob> {
    if (!ReminderTriggerCronJob.instance) {
      ReminderTriggerCronJob.instance = new ReminderTriggerCronJob();
      await ReminderTriggerCronJob.instance.initialize();
    }
    return ReminderTriggerCronJob.instance;
  }

  /**
   * 初始化调度服务
   */
  private async initialize(): Promise<void> {
    try {
      const container = ReminderContainer.getInstance();
      const templateRepo = container.getReminderTemplateRepository();
      const statsRepo = container.getReminderStatisticsRepository();
      const groupRepo = container.getReminderGroupRepository();
      
      // 创建 ControlService（需要 group repository）
      const controlService = container.getControlService();
      
      // 创建 TriggerService
      const triggerService = new ReminderTriggerService(
        templateRepo,
        statsRepo,
        controlService,
      );

      // 创建 SchedulerService
      this.schedulerService = new ReminderSchedulerService(
        templateRepo,
        statsRepo,
        triggerService,
      );

      logger.info('ReminderSchedulerService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ReminderSchedulerService', { error });
      throw error;
    }
  }

  /**
   * 启动定时任务
   */
  start(): void {
    if (this.cronTask) {
      logger.warn('Cron job already started');
      return;
    }

    // 每分钟执行一次
    this.cronTask = cron.schedule('* * * * *', async () => {
      await this.execute();
    });

    // 手动启动任务
    this.cronTask.start();
    
    logger.info('Reminder trigger cron job started (runs every minute)');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      logger.info('Reminder trigger cron job stopped');
    }
  }

  /**
   * 执行触发逻辑
   */
  private async execute(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Previous job still running, skipping this execution');
      return;
    }

    if (!this.schedulerService) {
      logger.error('SchedulerService not initialized');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug('Starting reminder trigger scan...');

      // 调用调度服务执行触发
      const result = await this.schedulerService.schedule();

      const duration = Date.now() - startTime;
      
      logger.info('Reminder trigger scan completed', {
        totalProcessed: result.totalCount,
        totalTriggered: result.successCount,
        totalFailed: result.failedCount,
        duration: `${duration}ms`,
      });

      // 如果有失败的提醒，记录详细信息
      if (result.failedCount > 0) {
        logger.warn('Some reminders failed to trigger', {
          failedCount: result.failedCount,
          details: result.details.filter(d => !d.success),
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Error executing reminder trigger scan', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 手动触发执行（用于测试）
   */
  async manualTrigger(): Promise<void> {
    logger.info('Manual trigger requested');
    await this.execute();
  }

  /**
   * 获取任务状态
   */
  getStatus(): { isRunning: boolean; isScheduled: boolean } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronTask !== null,
    };
  }
}

// 导出单例工厂函数
export const startReminderTriggerCronJob = async (): Promise<void> => {
  const job = await ReminderTriggerCronJob.getInstance();
  job.start();
};

export const stopReminderTriggerCronJob = async (): Promise<void> => {
  const job = await ReminderTriggerCronJob.getInstance();
  job.stop();
};

export const manualTriggerReminders = async (): Promise<void> => {
  const job = await ReminderTriggerCronJob.getInstance();
  await job.manualTrigger();
};

export const getReminderCronJobStatus = async (): Promise<{
  isRunning: boolean;
  isScheduled: boolean;
}> => {
  const job = await ReminderTriggerCronJob.getInstance();
  return job.getStatus();
};
