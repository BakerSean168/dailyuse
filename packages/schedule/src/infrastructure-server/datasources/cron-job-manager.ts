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
 * - Maintain taskUuid to CronJob mapping in memory
 */

import cron from 'node-cron';
import { createLogger } from '@dailyuse/utils';
import { ScheduleTask } from '@/domain-server';
import { ScheduleMonitor } from '../datasources/schedule-monitor';

const logger = createLogger('CronJobManager');

type CronJob = ReturnType<typeof cron.schedule>;

export class CronJobManager {
  private static instance: CronJobManager;

  /** taskUuid to CronJob mapping */
  private jobs: Map<string, CronJob> = new Map();

  /** taskUuid to cron expression mapping (for debugging) */
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
    const taskUuid = task.uuid;
    const cronExpression = task.schedule.cronExpression;

    if (!cronExpression) {
      logger.warn('Task has no cron expression, skipping registration', {
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
            // Record execution start
            this.monitor.recordExecutionStart(taskUuid, task.name);
            
            // Execute task logic here
            logger.info('Task execution completed', {
              taskUuid,
              taskName: task.name,
            });
            
            this.monitor.recordExecutionSuccess(taskUuid, task.name);
          } catch (error) {
            logger.error('Failed to execute cron task', {
              taskUuid,
              error,
            });
            if (error instanceof Error) {
              this.monitor.recordExecutionFailure(taskUuid, task.name, error);
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
          taskUuid,
          taskName: task.name,
          cronExpression,
          timezone: task.schedule.timezone,
          status: task.status,
        });
      } else {
        // Task registered but not started (paused/disabled)
        logger.info('Task registered but not started (paused or disabled)', {
          taskUuid,
          taskName: task.name,
          status: task.status,
          enabled: task.enabled,
        });
      }

      // Save to mapping
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
   * Unregister ScheduleTask Cron Job
   *
   * @param taskUuid - Task UUID
   * @returns Whether unregistration was successful
   */
  public unregisterTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('Task is not registered, cannot unregister', { taskUuid });
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
   * Start a Cron Job
   */
  public startTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('Task is not registered, cannot start', { taskUuid });
      return false;
    }

    job.start();
    logger.info('Task started', { taskUuid });
    return true;
  }

  /**
   * Stop a Cron Job
   */
  public stopTask(taskUuid: string): boolean {
    const job = this.jobs.get(taskUuid);

    if (!job) {
      logger.warn('Task is not registered, cannot stop', { taskUuid });
      return false;
    }

    job.stop();
    logger.info('Task stopped', { taskUuid });
    return true;
  }

  /**
   * Update a task (re-register)
   */
  public async updateTask(task: ScheduleTask): Promise<boolean> {
    this.unregisterTask(task.uuid);
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
          taskUuid: t.taskUuid,
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
    for (const [taskUuid, job] of this.jobs.entries()) {
      job.stop();
      logger.info('Task stopped', { taskUuid });
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
