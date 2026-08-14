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
import { createLogger } from '@memoflow/utils/logger';
import type { ReminderModuleRuntimeContribution } from '../reminder.module';

const logger = createLogger('ReminderTriggerCronJob');

import type { ReminderReliableOperationPort } from '@memoflow/contracts/reliable-messaging';
import type { ReminderTransactionRunner } from '../../domain/ports/reminder-transaction-runner.port';

// ---------------------------------------------------------------------------
// Dependencies — what the cron job needs from the outside world.
// 依赖 —— 定时任务向外部索取的全部依赖。
// ---------------------------------------------------------------------------

export interface ReminderTriggerCronJobDependencies {
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderGroupRepository: IReminderGroupRepository;
  readonly reliablePort: ReminderReliableOperationPort;
  readonly transactionRunner: ReminderTransactionRunner;
  readonly schedulerService?: ReminderSchedulerService;
  readonly drainTimeoutMs?: number;
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
  const { reminderTemplateRepository, reminderGroupRepository, reliablePort, transactionRunner } = deps;

  if (!deps.schedulerService && (!reliablePort || !transactionRunner)) {
    throw new Error(
      '[REMINDER_CRON_JOB] Mandatory dependencies missing: reliablePort and transactionRunner are required.',
    );
  }

  // Assemble domain services once / 一次性组装领域服务
  const controlService = new ReminderTemplateControlService(
    reminderTemplateRepository,
    reminderGroupRepository,
  );
  const triggerService = new ReminderTriggerService(reminderTemplateRepository, controlService);
  const schedulerService =
    deps.schedulerService ??
    new ReminderSchedulerService(
      reminderTemplateRepository,
      triggerService,
      reliablePort,
      transactionRunner,
      controlService,
    );

  let cronTask: cron.ScheduledTask | null = null;
  let isRunning = false;
  let isStopping = false;
  let currentExecutionPromise: Promise<void> | null = null;

  async function executeInternal(): Promise<void> {
    if (isRunning || isStopping) {
      logger.debug('Previous job still running or cron stopping, skipping this execution');
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

  function runScan(): Promise<void> {
    if (isRunning || isStopping) {
      logger.debug('Previous job still running or cron stopping, skipping this execution');
      return currentExecutionPromise ?? Promise.resolve();
    }

    const promise = executeInternal().finally(() => {
      if (currentExecutionPromise === promise) {
        currentExecutionPromise = null;
      }
    });

    currentExecutionPromise = promise;
    return promise;
  }

  return {
    start() {
      if (cronTask) {
        logger.warn('Cron job already started');
        return;
      }
      isStopping = false;

      cronTask = cron.schedule('* * * * *', () => {
        runScan();
      });
      cronTask.start();
      logger.info('Reminder trigger cron job started (runs every minute)');
    },

    async stop(timeoutMs?: number): Promise<void> {
      const effectiveTimeout = timeoutMs ?? deps.drainTimeoutMs ?? 10000;
      isStopping = true;
      if (cronTask) {
        cronTask.stop();
        cronTask = null;
      }

      if (currentExecutionPromise) {
        logger.info('Waiting for active reminder trigger scan batch to drain...');
        let timeoutHandle: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            logger.error(`Cron drain timed out after ${effectiveTimeout}ms: active execution did not finish`);
            reject(new Error(`Cron drain timed out after ${effectiveTimeout}ms: in-flight execution did not finish`));
          }, effectiveTimeout);
        });

        try {
          await Promise.race([currentExecutionPromise, timeoutPromise]);
        } finally {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
        }
      }

      logger.info('Reminder trigger cron job stopped');
    },

    execute(): Promise<void> {
      return runScan();
    },
  };
}
