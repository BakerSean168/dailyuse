import type { IScheduler, ITaskHandler } from '../interfaces';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('IntervalScheduler');

/**
 * IntervalScheduler
 *
 * 基于原生 setInterval 的调度器实现
 * 最简单的实现，用于固定间隔的任务
 *
 * 优点：
 * - 零依赖
 * - 最简单的实现
 * - 适合固定间隔任务
 *
 * 缺点：
 * - 不支持 Cron 表达式
 * - 只支持固定间隔
 * - 不阻塞主线程（后台运行）
 *
 * 适用场景：心跳检测、简单的固定间隔任务
 */
export class IntervalScheduler implements IScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private handlers: Map<string, ITaskHandler> = new Map();
  private taskIntervals: Map<string, number> = new Map();
  private registeredTasks: Set<string> = new Set();
  private isRunning = false;

  async register(taskId: string, schedule: string | number, handler: ITaskHandler): Promise<void> {
    if (this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is already registered`);
    }

    if (typeof schedule === 'string') {
      throw new Error(
        `IntervalScheduler does not support Cron expressions. Use BreeScheduler or CronScheduler instead.`,
      );
    }

    if (schedule < 100) {
      throw new Error(`Task interval must be at least 100ms`);
    }

    this.handlers.set(taskId, handler);
    this.taskIntervals.set(taskId, schedule);
    this.registeredTasks.add(taskId);

    if (this.isRunning) {
      this.startTask(taskId, schedule);
    }
  }

  async unregister(taskId: string): Promise<void> {
    if (!this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is not registered`);
    }

    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
    }

    this.handlers.delete(taskId);
    this.taskIntervals.delete(taskId);
    this.registeredTasks.delete(taskId);
  }

  async start(): Promise<void> {
    this.isRunning = true;

    for (const [taskId, intervalMs] of this.taskIntervals) {
      if (!this.intervals.has(taskId)) {
        this.startTask(taskId, intervalMs);
      }
    }

    logger.info(`Started with ${this.registeredTasks.size} tasks`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
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

  private startTask(taskId: string, intervalMs: number): void {
    const interval = setInterval(async () => {
      try {
        const handler = this.handlers.get(taskId);
        if (handler) {
          await handler.execute(taskId);
        }
      } catch (error) {
        console.error(`[IntervalScheduler] Task ${taskId} failed:`, error);
      }
    }, intervalMs);

    this.intervals.set(taskId, interval);
  }
}
