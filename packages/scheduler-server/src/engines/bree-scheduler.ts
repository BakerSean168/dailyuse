import Bree from 'bree';
import type { IScheduler, ITaskHandler } from '../interfaces';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('BreeScheduler');

/**
 * BreeScheduler
 *
 * 基于 Bree 库的调度器实现（推荐）
 * 支持 Worker、强大的 Cron 支持、生产级别的稳定性
 *
 * 优点：
 * - 支持 Worker 隔离，不阻塞主线程
 * - 功能完整，支持各种高级特性
 * - 生产级别的稳定性
 *
 * 缺点：
 * - 依赖较重
 * - 配置相对复杂
 *
 * 适用场景：生产环境、需要高可靠性的任务调度
 */
export class BreeScheduler implements IScheduler {
  private bree: Bree;
  private handlers: Map<string, ITaskHandler> = new Map();
  private registeredTasks: Set<string> = new Set();

  constructor(options?: { root?: string | false }) {
    this.bree = new Bree({
      root: options?.root ?? false,
      jobs: [],
      defaultExtension: 'ts',
    });
  }

  async register(taskId: string, schedule: string | number, handler: ITaskHandler): Promise<void> {
    if (this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is already registered`);
    }

    if (typeof schedule === 'number') {
      throw new Error(
        `BreeScheduler does not support interval scheduling. Use IntervalScheduler instead.`,
      );
    }

    this.handlers.set(taskId, handler);
    this.registeredTasks.add(taskId);

    try {
      this.bree.add({
        name: taskId,
        cron: schedule,
        worker: {
          workerData: { taskId },
          eval: true,
        },
      });
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

    try {
      await this.bree.remove(taskId);
    } catch (error) {
      console.error(`[BreeScheduler] Failed to remove task ${taskId}:`, error);
    }

    this.handlers.delete(taskId);
    this.registeredTasks.delete(taskId);
  }

  async start(): Promise<void> {
    await this.bree.start();
    logger.info(`Started with ${this.registeredTasks.size} tasks`);
  }

  async stop(): Promise<void> {
    await this.bree.stop();
    logger.info('Stopped');
  }

  getRegisteredTasks(): string[] {
    return Array.from(this.registeredTasks);
  }

  isRegistered(taskId: string): boolean {
    return this.registeredTasks.has(taskId);
  }
}
