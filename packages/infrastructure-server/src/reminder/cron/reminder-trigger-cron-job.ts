// @ts-nocheck
/**
 * Reminder Trigger Cron Job
 * 
 * 鑱岃矗锛?
 * - 姣忓垎閽熸壂鎻忛渶瑕佽Е鍙戠殑鎻愰啋妯℃澘
 * - 璋冪敤 ReminderSchedulerService 鎵ц瑙﹀彂閫昏緫
 * - Record瑙﹀彂鍘嗗彶
 * - Update涓嬫瑙﹀彂鏃堕棿
 * 
 * 瑙﹀彂棰戠巼锛氭瘡鍒嗛挓鎵ц涓€娆?
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
   * Get鍗曚緥瀹炰緥
   */
  static async getInstance(): Promise<ReminderTriggerCronJob> {
    if (!ReminderTriggerCronJob.instance) {
      ReminderTriggerCronJob.instance = new ReminderTriggerCronJob();
      await ReminderTriggerCronJob.instance.initialize();
    }
    return ReminderTriggerCronJob.instance;
  }

  /**
   * 鍒濆鍖栬皟搴︽湇鍔?
   */
  private async initialize(): Promise<void> {
    try {
      const container = ReminderContainer.getInstance();
      const templateRepo = container.getReminderTemplateRepository();
      const statsRepo = container.getReminderStatisticsRepository();
      const groupRepo = container.getReminderGroupRepository();
      
      // Create ControlService锛堥渶瑕?group repository锛?
      const controlService = container.getControlService();
      
      // Create TriggerService
      const triggerService = new ReminderTriggerService(
        templateRepo,
        statsRepo,
        controlService,
      );

      // Create SchedulerService
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
   * 鍚姩瀹氭椂浠诲姟
   */
  start(): void {
    if (this.cronTask) {
      logger.warn('Cron job already started');
      return;
    }

    // 姣忓垎閽熸墽琛屼竴娆?
    this.cronTask = cron.schedule('* * * * *', async () => {
      await this.execute();
    });

    // 鎵嬪姩鍚姩浠诲姟
    this.cronTask.start();
    
    logger.info('Reminder trigger cron job started (runs every minute)');
  }

  /**
   * 鍋滄瀹氭椂浠诲姟
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      logger.info('Reminder trigger cron job stopped');
    }
  }

  /**
   * 鎵ц瑙﹀彂閫昏緫
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

      // 璋冪敤璋冨害鏈嶅姟鎵ц瑙﹀彂
      const result = await this.schedulerService.schedule();

      const duration = Date.now() - startTime;
      
      logger.info('Reminder trigger scan completed', {
        totalProcessed: result.totalCount,
        totalTriggered: result.successCount,
        totalFailed: result.failedCount,
        duration: `${duration}ms`,
      });

      // 濡傛灉鏈夊け璐ョ殑鎻愰啋锛岃褰曡缁嗕俊鎭?
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
   * 鎵嬪姩瑙﹀彂鎵ц锛堢敤浜庢祴璇曪級
   */
  async manualTrigger(): Promise<void> {
    logger.info('Manual trigger requested');
    await this.execute();
  }

  /**
   * Get浠诲姟鐘舵€?
   */
  getStatus(): { isRunning: boolean; isScheduled: boolean } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronTask !== null,
    };
  }
}

// 瀵煎嚭鍗曚緥宸ュ巶鍑芥暟
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
