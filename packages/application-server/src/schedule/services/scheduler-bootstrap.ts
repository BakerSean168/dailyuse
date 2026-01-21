/**
 * SchedulerBootstrap
 *
 * 新的调度器初始化代码
 * 使用 scheduler-server 包和 BreeScheduler 引擎
 *
 * 替代现有的 ScheduleBootstrap 和 CronJobManager
 *
 * @architecture
 * - 依赖 @dailyuse/scheduler-server（新增包）
 * - 依赖 ScheduleTaskExecutorAdapter（ITaskHandler 实现）
 * - 消除对 Infrastructure 层调度器的直接依赖
 * - 完全符合分层架构
 */

import { createLogger } from '@dailyuse/utils';
import { BreeScheduler } from '@dailyuse/scheduler-server';
import type { IScheduler } from '@dailyuse/scheduler-server';
import { ScheduleTaskExecutorAdapter } from './schedule-task-executor-adapter';

const logger = createLogger('SchedulerBootstrap');

/**
 * 调度器启动器
 * 
 * 职责：
 * - 初始化 BreeScheduler（或其他调度引擎）
 * - 从数据库加载所有活跃任务
 * - 注册任务到调度器
 * - 启动调度器
 */
export class SchedulerBootstrap {
  private static instance: SchedulerBootstrap;
  private scheduler: IScheduler;
  private repository: PrismaScheduleTaskRepository;
  private handler: ScheduleTaskExecutorAdapter;
  private initialized = false;

  private constructor() {
    // 初始化依赖
    const prisma = ReminderContainer.getInstance().getPrismaClient();
    this.repository = new PrismaScheduleTaskRepository(prisma);
    this.handler = new ScheduleTaskExecutorAdapter();

    // 使用 BreeScheduler（推荐）
    this.scheduler = new BreeScheduler({
      root: false, // 禁用文件系统 Worker
    });
  }

  public static getInstance(): SchedulerBootstrap {
    if (!SchedulerBootstrap.instance) {
      SchedulerBootstrap.instance = new SchedulerBootstrap();
    }
    return SchedulerBootstrap.instance;
  }

  /**
   * 初始化调度器
   *
   * 执行步骤：
   * 1. 从数据库加载所有启用的活跃任务
   * 2. 为每个任务注册到 BreeScheduler
   * 3. 启动调度器
   *
   * @throws 初始化失败时抛出错误
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('⚠️ 调度器已经初始化过了');
      return;
    }

    try {
      logger.info('🚀 开始初始化调度器...');

      // 步骤 1: 从数据库加载所有启用的活跃任务
      await this.loadAndRegisterTasks();

      // 步骤 2: 启动调度器
      await this.scheduler.start();

      this.initialized = true;
      logger.info('✅ 调度器初始化完成');
    } catch (error) {
      logger.error('❌ 调度器初始化失败', { error });
      throw error;
    }
  }

  /**
   * 从数据库加载任务并注册到调度器
   */
  private async loadAndRegisterTasks(): Promise<void> {
    try {
      const tasks = await this.repository.findEnabled();
      logger.info('📋 加载任务', { count: tasks.length });

      let registered = 0;

      for (const task of tasks) {
        if (task.status !== 'active' || !task.enabled) {
          continue;
        }

        try {
          await this.scheduler.register(task.uuid, task.schedule.cronExpression, this.handler);
          registered++;
        } catch (error) {
          logger.error(`❌ 注册任务失败: ${task.uuid}`, { error });
        }
      }

      logger.info(`✅ 已注册 ${registered}/${tasks.length} 个任务`);
    } catch (error) {
      logger.error('❌ 加载任务失败', { error });
      throw error;
    }
  }

  /**
   * 停止调度器
   */
  public async shutdown(): Promise<void> {
    try {
      await this.scheduler.stop();
      logger.info('✅ 调度器已停止');
    } catch (error) {
      logger.error('❌ 停止调度器失败', { error });
      throw error;
    }
  }

  /**
   * 获取调度器实例
   */
  public getScheduler(): IScheduler {
    return this.scheduler;
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}
