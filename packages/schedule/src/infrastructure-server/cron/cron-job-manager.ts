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
 * - In-memory mapping of taskId to CronJob instances
 */

import cron from 'node-cron';
import { createLogger } from '@dailyuse/utils';
import { ScheduleTask } from '../../domain-server/aggregates/schedule-task';
import { ScheduleTaskExecutor } from '@dailyuse/schedule/application-server';
import { ScheduleMonitor } from '../monitoring/ScheduleMonitor';

const logger = createLogger('CronJobManager');

type CronJob = ReturnType<typeof cron.schedule>;

export class CronJobManager {
  private static instance: CronJobManager;

  /** taskId to CronJob instance map */
  private jobs: Map<string, CronJob> = new Map();

  /** taskId to cron expression map (for debugging) */
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
    const taskId = task.id;
    const cronExpression = task.schedule.cronExpression;

    if (!cronExpression) {
      logger.warn('Warning: Task has no cron expression, skipping registration', {
        taskId,
        taskName: task.name,
      });
      return false;
    }

    // If task is already registered, unregister first
    if (this.jobs.has(taskId)) {
      this.unregisterTask(taskId);
    }

    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        logger.error('Invalid cron expression', {
          taskId,
          cronExpression,
        });
        return false;
      }

      // Create Cron Job
      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info('Cron triggered', {
            taskId,
            taskName: task.name,
            cronExpression,
            triggeredAt: new Date().toISOString(),
          });

          try {
            await this.executor!.executeTaskById(taskId);
          } catch (error) {
            logger.error('Failed to execute task from cron', {
              taskId,
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
          taskId,
          taskName: task.name,
          cronExpression,
          timezone: task.schedule.timezone,
          status: task.status,
        });
      } else {
        // Task is registered but not started (paused or disabled)
        logger.info('Task registered but not started (paused or disabled)', {
          taskId,
          taskName: task.name,
          status: task.status,
          enabled: task.enabled,
        });
      }

      // Save to maps
      this.jobs.set(taskId, job);
      this.cronExpressions.set(taskId, cronExpression);

      return true;
    } catch (error) {
      logger.error('Failed to register task', {
        taskId,
        cronExpression,
        error,
      });
      return false;
    }
  }

  /**
   * Unregister task's Cron Job
   *
   * @param taskId - Task UUID
   * @returns Whether unregistration was successful
   */
  public unregisterTask(taskId: string): boolean {
    const job = this.jobs.get(taskId);

    if (!job) {
      logger.warn('Warning: Task not registered, cannot unregister', { taskId });
      return false;
    }

    try {
      job.stop();
      this.jobs.delete(taskId);
      this.cronExpressions.delete(taskId);

      logger.info('Task unregistered successfully', { taskId });
      return true;
    } catch (error) {
      logger.error('Failed to unregister task', { taskId, error });
      return false;
    }
  }

  /**
   * Start task's Cron Job
   */
  public startTask(taskId: string): boolean {
    const job = this.jobs.get(taskId);

    if (!job) {
      logger.warn('Warning: Task not registered, cannot start', { taskId });
      return false;
    }

    job.start();
    logger.info('Task started', { taskId });
    return true;
  }

  /**
   * Stop task's Cron Job
   */
  public stopTask(taskId: string): boolean {
    const job = this.jobs.get(taskId);

    if (!job) {
      logger.warn('Warning: Task not registered, cannot stop', { taskId });
      return false;
    }

    job.stop();
    logger.info('Task stopped', { taskId });
    return true;
  }

  /**
   * Update task (re-register)
   */
  public async updateTask(task: ScheduleTask): Promise<boolean> {
    this.unregisterTask(task.id);
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
    taskId: string;
    cronExpression: string;
    isRunning: boolean;
  }> {
    return Array.from(this.jobs.entries()).map(([taskId, job]) => ({
      taskId,
      cronExpression: this.cronExpressions.get(taskId) || 'unknown',
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
          taskId: t.taskId,
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
    for (const [taskId, job] of this.jobs.entries()) {
      job.stop();
      logger.info('Task stopped', { taskId });
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
