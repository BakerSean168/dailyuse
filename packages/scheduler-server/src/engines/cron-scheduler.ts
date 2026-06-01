import cron, { type ScheduledTask } from 'node-cron';
import type { IScheduler, ITaskHandler } from '../interfaces';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('CronScheduler');

/**
 * CronScheduler
 *
 * 基于 node-cron 库的调度器实现
 * 轻量级、零依赖的 Cron 表达式支持
 *
 * 优点：
 * - 轻量级，依赖少
 * - 简单易用
 * - 性能较好
 *
 * 缺点：
 * - 不支持 Worker 隔离
 * - 功能不如 Bree 完整
 *
 * 适用场景：简单任务调度、开发环境、资源受限的场景
 */
export class CronScheduler implements IScheduler {
  private jobs: Map<string, ScheduledTask> = new Map();
  private handlers: Map<string, ITaskHandler> = new Map();
  private registeredTasks: Set<string> = new Set();
  private isRunning = false;

  async register(taskId: string, schedule: string | number, handler: ITaskHandler): Promise<void> {
    if (this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is already registered`);
    }

    if (typeof schedule === 'number') {
      throw new Error(
        `CronScheduler does not support interval scheduling. Use IntervalScheduler instead.`,
      );
    }

    this.handlers.set(taskId, handler);
    this.registeredTasks.add(taskId);

    try {
      const task = cron.schedule(schedule, async () => {
        const taskHandler = this.handlers.get(taskId);
        if (taskHandler) {
          await taskHandler.execute(taskId);
        }
      });

      // Keep the task paused until scheduler starts
      task.stop();
      this.jobs.set(taskId, task);
    } catch (error) {
      this.registeredTasks.delete(taskId);
      this.handlers.delete(taskId);
      throw error;
    }
  }

  async unregister(taskId: string): Promise<void> {
    if (!this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is not registered`);
    }

    const task = this.jobs.get(taskId);
    if (task) {
      task.stop();
      task.destroy();
      this.jobs.delete(taskId);
    }

    this.handlers.delete(taskId);
    this.registeredTasks.delete(taskId);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    for (const task of this.jobs.values()) {
      task.start();
    }
    logger.info(`Started with ${this.registeredTasks.size} tasks`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    for (const task of this.jobs.values()) {
      task.stop();
    }
    logger.info('Stopped');
  }

  getRegisteredTasks(): string[] {
    return Array.from(this.registeredTasks);
  }

  isRegistered(taskId: string): boolean {
    return this.registeredTasks.has(taskId);
  }

  isRunning_(): boolean {
    return this.isRunning;
  }
}
