/**
 * CronJobManager - Cron Job Manager
 *
 * @responsibility
 * - Manage all scheduled Cron jobs for ScheduleTask
 * - Support dynamic registration and unregistration of Cron jobs
 * - Trigger ScheduleTaskExecutor to execute tasks on schedule
 *
 * @architecture
 * - Infrastructure layer
 * - Use node-cron to manage scheduled tasks
 * - In-memory mapping of taskUuid to CronJob instances
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

  /** taskUuid to CronJob instance map */
  private jobs: Map<string, CronJob> = new Map();

  /** taskUuid to cron expression map (for debugging) */
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
   * Register task's Cron Job
   *
   * @param task - ScheduleTask object
   * @returns Whether registration was successful
   */
  public registerTask(task: ScheduleTask): boolean {
    const taskUuid = task.uuid;
    const cronExpression = task.schedule.cronExpression;

    if (!cronExpression) {
      logger.warn('Warning: Task has no cron expression, skipping registration', {
        taskUuid,
        taskName: task.name,
      });
      return false;
    }

    // If task is already registered, unregister first
    if (this.jobs.has(taskUuid)) {
      this.unregisterTask(taskUuid);
    }

    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        logger.error('Invalid cron expression', {
          taskUuid,
          cronExpression,
        });
        return false;
      }

      // Create Cron Job
      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info('Cron triggered', {
            taskUuid,
            taskName: task.name,
            cronExpression,
            triggeredAt: new Date().toISOString(),
          });

          try {
            await this.executor!.executeTaskByUuid(taskUuid);
          } catch (error) {
            logger.error('Failed to execute task from cron', {
              taskUuid,
              error,
            });
          }
        },
        {
          timezone: task.schedule.timezone || 'Asia/Shanghai',
        },
      );

      // Determine whether to start based on status
      // Only start jobs that are ACTIVE and enabled=true
      if (task.isActive() && task.enabled) {
        job.start();
        logger.info('Task registered and started successfully', {
          taskUuid,
          taskName: task.name,
          cronExpression,
          timezone: task.schedule.timezone,
          status: task.status,
        });
      } else {
        // Task is registered but not started (paused or disabled)
        logger.info('Task registered but not started (paused or disabled)', {
          taskUuid,
          taskName: task.name,
          status: task.status,
          enabled: task.enabled,
        });
      }

      // Save to maps
      this.jobs.set(taskUuid, job);
      this.cronExpressions.set(taskUuid, cronExpression);

      return true;
    } catch (error) {
      logger.error('Failed to register task', {
        taskUuid,
        cronExpression,
        error,
      });
      return false;
    }
  }

  /**
   * Unregister task's Cron Job
   *
   * @param taskUuid - Task UUID
   * @returns Whether unregistration was successful
   */
  public unregisterTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('Warning: Task not registered, cannot unregister', { taskUuid });
      return false;
    }

    try {
      job.stop();
      this.jobs.delete(taskUuid);
      this.cronExpressions.delete(taskUuid);

      logger.info('Task unregistered successfully', { taskUuid });
      return true;
    } catch (error) {
      logger.error('Failed to unregister task', { taskUuid, error });
      return false;
    }
  }

  /**
   * Start task's Cron Job
   */
  public startTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('Warning: Task not registered, cannot start', { taskUuid });
      return false;
    }

    job.start();
    logger.info('Task started', { taskUuid });
    return true;
  }

  /**
   * Stop task's Cron Job
   */
  public stopTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('Warning: Task not registered, cannot stop', { taskUuid });
      return false;
    }

    job.stop();
    logger.info('Task stopped', { taskUuid });
    return true;
  }

  /**
   * Update task (re-register)
   */
  public async updateTask(task: ScheduleTask): Promise<boolean> {
    this.unregisterTask(task.uuid);
    return await this.registerTask(task);
  }

  /**
   * Get statistics of all registered tasks
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
   * Get information of all currently registered tasks
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
   * Print Cron Job Monitor Report
   */
  public printCronMonitorReport(): void {
    const registeredTasks = this.getRegisteredTasks();
    const runningCount = registeredTasks.filter((t) => t.isRunning).length;

    logger.info('CronJobManager Monitor Report', {
      'Registered Tasks Count': registeredTasks.length,
      'Running Tasks': runningCount,
      'Stopped Tasks': registeredTasks.length - runningCount,
    });

    if (registeredTasks.length > 0) {
      logger.info('Task List:', {
        tasks: registeredTasks.map((t) => ({
          taskUuid: t.taskUuid,
          'Cron Expression': t.cronExpression,
          'Status': t.isRunning ? 'Running' : 'Stopped',
        })),
      });
    }

    // Print execution statistics
    this.monitor.printMonitorReport();
  }

  /**
   * Stop all jobs
   */
  public stopAll(): void {
    for (const [taskUuid, job] of this.jobs.entries()) {
      job.stop();
      logger.info('Task stopped', { taskUuid });
    }
  }

  /**
   * Clear all jobs
   */
  public clear(): void {
    this.stopAll();
    this.jobs.clear();
    this.cronExpressions.clear();
    logger.info('All jobs cleared');
  }
}
