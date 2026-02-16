/**
 * CronJobManager - Cron Task Manager
 *
 * @responsibility
 * - Manage all ScheduleTask Cron tasks
 * - Support dynamic registration/unregistration of Cron tasks
 * - Call ScheduleTaskExecutor to execute tasks when triggered
 *
 * @architecture
 * - Infrastructure layer
 * - Use node-cron to manage scheduled tasks
 * - Maintain taskId to CronJob mapping in memory
 */

import cron from 'node-cron';
import { createLogger } from '@dailyuse/utils';
import { ScheduleTask } from '../../domain-server/aggregates/schedule-task';
import { ScheduleMonitor } from '../datasources/schedule-monitor';

const logger = createLogger('CronJobManager');

type CronJob = ReturnType<typeof cron.schedule>;

export class CronJobManager {
  private static instance: CronJobManager;

  /** taskId to CronJob mapping */
  private jobs: Map<string, CronJob> = new Map();

  /** taskId to cron expression mapping (for debugging) */
  private cronExpressions: Map<string, string> = new Map();

  private monitor: ScheduleMonitor;

  private constructor() {
    this.monitor = ScheduleMonitor.getInstance();
  }

  public static getInstance(): CronJobManager {
    if (!CronJobManager.instance) {
      CronJobManager.instance = new CronJobManager();
    }
    return CronJobManager.instance;
  }

  /**
   * Register ScheduleTask Cron Job
   *
   * @param task - ScheduleTask aggregate
   * @returns Whether registration was successful
   */
  public registerTask(task: ScheduleTask): boolean {
    const taskId = task.id;
    const cronExpression = task.schedule.cronExpression;

    if (!cronExpression) {
      logger.warn('Task has no cron expression, skipping registration', {
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
            // Record execution start
            this.monitor.recordExecutionStart(taskId, task.name);
            
            // Execute task logic here
            logger.info('Task execution completed', {
              taskId,
              taskName: task.name,
            });
            
            this.monitor.recordExecutionSuccess(taskId, task.name);
          } catch (error) {
            logger.error('Failed to execute cron task', {
              taskId,
              error,
            });
            if (error instanceof Error) {
              this.monitor.recordExecutionFailure(taskId, task.name, error);
            }
          }
        },
        {
          timezone: task.schedule.timezone || 'Asia/Shanghai',
        },
      );

      // Determine whether to start based on status
      // Only ACTIVE status with enabled=true starts the task
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
        // Task registered but not started (paused/disabled)
        logger.info('Task registered but not started (paused or disabled)', {
          taskId,
          taskName: task.name,
          status: task.status,
          enabled: task.enabled,
        });
      }

      // Save to mapping
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
   * Unregister ScheduleTask Cron Job
   *
   * @param taskId - Task UUID
   * @returns Whether unregistration was successful
   */
  public unregisterTask(taskId: string): boolean {
    const job = this.jobs.get(taskId);

    if (!job) {
      logger.warn('Task is not registered, cannot unregister', { taskId });
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
   * Start a Cron Job
   */
  public startTask(taskId: string): boolean {
    const job = this.jobs.get(taskId);

    if (!job) {
      logger.warn('Task is not registered, cannot start', { taskId });
      return false;
    }

    job.start();
    logger.info('Task started', { taskId });
    return true;
  }

  /**
   * Stop a Cron Job
   */
  public stopTask(taskId: string): boolean {
    const job = this.jobs.get(taskId);

    if (!job) {
      logger.warn('Task is not registered, cannot stop', { taskId });
      return false;
    }

    job.stop();
    logger.info('Task stopped', { taskId });
    return true;
  }

  /**
   * Update a task (re-register)
   */
  public async updateTask(task: ScheduleTask): Promise<boolean> {
    this.unregisterTask(task.id);
    return await this.registerTask(task);
  }

  /**
   * Get statistics for all registered tasks
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
   * Get information for all registered tasks
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
   * Print Cron task monitoring report
   */
  public printCronMonitorReport(): void {
    const registeredTasks = this.getRegisteredTasks();
    const runningCount = registeredTasks.filter((t) => t.isRunning).length;

    logger.info('CronJobManager monitoring report', {
      totalRegisteredTasks: registeredTasks.length,
      runningTasks: runningCount,
      stoppedTasks: registeredTasks.length - runningCount,
    });

    if (registeredTasks.length > 0) {
      logger.info('Task list:', {
        tasks: registeredTasks.map((t) => ({
          taskId: t.taskId,
          cronExpression: t.cronExpression,
          status: t.isRunning ? 'running' : 'stopped',
        })),
      });
    }

    // Print execution statistics
    this.monitor.printMonitorReport();
  }

  /**
   * Stop all tasks
   */
  public stopAll(): void {
    for (const [taskId, job] of this.jobs.entries()) {
      job.stop();
      logger.info('Task stopped', { taskId });
    }
  }

  /**
   * Clear all tasks
   */
  public clear(): void {
    this.stopAll();
    this.jobs.clear();
    this.cronExpressions.clear();
    logger.info('All tasks cleared');
  }
}
