/**
 * Reminder Trigger Cron Job — factory-based, container-free.
 * 提醒触发定时任务 —— 基于工厂模式，无容器依赖。
 *
 * 职责：
 * - 每分钟扫描需要触发的提醒模板
 * - 调用 ReminderSchedulerService 执行触发逻辑
 * - Record 触发历史
 * - Update 下次触发时间
 *
 * 触发频率：每分钟执行一次
 * Cron Expression: '* * * * *'
 *
 * Dependencies are injected via the factory function, not via a singleton container.
 * 依赖通过工厂函数注入，而非单例容器。
 */

import * as cron from 'node-cron';
import type { IReminderTemplateRepository } from '../../domain/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../../domain/repositories/i-reminder-group-repository';
import { ReminderSchedulerService } from '../../domain/services/reminder-scheduler-service';
import { ReminderTriggerService } from '../../domain/services/reminder-trigger-service';
import { ReminderTemplateControlService } from '../../domain/services/reminder-template-control-service';
import { createLogger } from '@dailyuse/utils/logger';
import type { ReminderModuleRuntimeContribution } from '../reminder.module';

const logger = createLogger('ReminderTriggerCronJob');

// ---------------------------------------------------------------------------
// Dependencies — what the cron job needs from the outside world.
// 依赖 —— 定时任务向外部索取的全部依赖。
// ---------------------------------------------------------------------------

export interface ReminderTriggerCronJobDependencies {
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderGroupRepository: IReminderGroupRepository;
}

// ---------------------------------------------------------------------------
// Factory — creates a ReminderModuleRuntimeContribution that manages the cron lifecycle.
// 工厂 —— 创建一个管理定时任务生命周期的 ReminderModuleRuntimeContribution。
// ---------------------------------------------------------------------------

/**
 * Creates a cron-based runtime contribution that scans for due reminders every minute.
 * 创建一个每分钟扫描到期提醒的定时任务运行时贡献。
 *
 * Wire this into `createReminderModule({ runtimeContributions: ... })`.
 * 将此贡献接入 `createReminderModule({ runtimeContributions: ... })`。
 */
export function createReminderTriggerCronJob(
  deps: ReminderTriggerCronJobDependencies,
): ReminderModuleRuntimeContribution {
  const { reminderTemplateRepository, reminderGroupRepository } = deps;

  // Assemble domain services once / 一次性组装领域服务
  const controlService = new ReminderTemplateControlService(
    reminderTemplateRepository,
    reminderGroupRepository,
  );
  const triggerService = new ReminderTriggerService(reminderTemplateRepository, controlService);
  const schedulerService = new ReminderSchedulerService(reminderTemplateRepository, triggerService);

  let cronTask: cron.ScheduledTask | null = null;
  let isRunning = false;

  async function execute(): Promise<void> {
    if (isRunning) {
      logger.debug('Previous job still running, skipping this execution');
      return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug('Starting reminder trigger scan...');

      const result = await schedulerService.schedule();
      const duration = Date.now() - startTime;

      logger.info('Reminder trigger scan completed', {
        totalProcessed: result.totalCount,
        totalTriggered: result.successCount,
        totalFailed: result.failedCount,
        duration: `${duration}ms`,
      });

      if (result.failedCount > 0) {
        logger.warn('Some reminders failed to trigger', {
          failedCount: result.failedCount,
          details: result.details.filter((d) => !d.ok),
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Error executing reminder trigger scan', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
      });
    } finally {
      isRunning = false;
    }
  }

  return {
    start() {
      if (cronTask) {
        logger.warn('Cron job already started');
        return;
      }

      cronTask = cron.schedule('* * * * *', async () => {
        await execute();
      });
      cronTask.start();
      logger.info('Reminder trigger cron job started (runs every minute)');
    },

    stop() {
      if (cronTask) {
        cronTask.stop();
        cronTask = null;
        logger.info('Reminder trigger cron job stopped');
      }
    },
  };
}
