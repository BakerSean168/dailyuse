/**
 * ScheduleExecutionService - 调度执行应用服务
 * 
 * 职责：
 * - 管理调度执行引擎的生命周期
 * - 协调执行引擎与仓储层
 * - 处理任务的添加、移除、暂停、恢复
 * - 记录执行结果
 * 
 * 架构位置：应用层（Application Layer）
 */

import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import { BreeExecutionEngine } from '../../infrastructure/execution/BreeExecutionEngine';
import { ScheduleContainer } from '../../infrastructure/di/ScheduleContainer';
import { isDevelopment, env } from '@/shared/infrastructure/config/env.js';
import path from 'path';

/**
 * 调度执行应用服务（单例）
 */
export class ScheduleExecutionService {
  private static instance: ScheduleExecutionService;
  private executionEngine: BreeExecutionEngine;
  private container = ScheduleContainer.getInstance();
  private isInitialized = false;

  private constructor() {
    const executionRepository = this.container.getScheduleExecutionRepository();
    // 初始化执行引擎
    this.executionEngine = new BreeExecutionEngine(
      {
        workerPath: path.join(__dirname, '../../infrastructure/workers'),
        verbose: isDevelopment,
        timezone: env.TZ,
        workerTimeout: 60000, // 60 秒
      },
      executionRepository,
    );
  }

  /**
   * 获取服务实例
   */
  static getInstance(): ScheduleExecutionService {
    if (!ScheduleExecutionService.instance) {
      ScheduleExecutionService.instance = new ScheduleExecutionService();
    }
    return ScheduleExecutionService.instance;
  }

  /**
   * 初始化执行引擎（在应用启动时调用）
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️  ScheduleExecutionService already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Schedule Execution Engine...');

      // 从数据库加载所有活跃的调度任务
      const taskRepository = this.container.getScheduleTaskRepository();
      const activeTasks = await taskRepository.findByStatus('active' as any);

      console.log(`📊 Found ${activeTasks.length} active schedule tasks`);

      // 启动执行引擎
      await this.executionEngine.start(activeTasks);

      this.isInitialized = true;
      console.log('✅ Schedule Execution Engine started successfully');
    } catch (error) {
      console.error('❌ Failed to start Schedule Execution Engine:', error);
      // 不抛出错误，允许应用继续启动
    }
  }

  /**
   * 停止执行引擎（在应用关闭时调用）
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️  ScheduleExecutionService not initialized');
      return;
    }

    try {
      console.log('⏹️  Stopping Schedule Execution Engine...');
      await this.executionEngine.stop();
      this.isInitialized = false;
      console.log('✅ Schedule Execution Engine stopped');
    } catch (error) {
      console.error('❌ Failed to stop Schedule Execution Engine:', error);
    }
  }

  /**
   * 添加新的调度任务到执行引擎
   * 
   * @param task ScheduleTask 聚合根
   */
  async addTask(task: ScheduleTask): Promise<void> {
    if (!this.executionEngine.isEngineRunning()) {
      console.warn('⚠️  Execution engine is not running, skipping task addition');
      return;
    }

    await this.executionEngine.addTask(task);
  }

  /**
   * 从执行引擎移除调度任务
   * 
   * @param taskId 任务 UUID
   */
  async removeTask(taskId: string): Promise<void> {
    if (!this.executionEngine.isEngineRunning()) {
      console.warn('⚠️  Execution engine is not running, skipping task removal');
      return;
    }

    await this.executionEngine.removeTask(taskId);
  }

  /**
   * 暂停任务执行
   * 
   * @param taskId 任务 UUID
   */
  async pauseTask(taskId: string): Promise<void> {
    if (!this.executionEngine.isEngineRunning()) {
      throw new Error('Execution engine is not running');
    }

    await this.executionEngine.pauseTask(taskId);
  }

  /**
   * 恢复任务执行
   * 
   * @param taskId 任务 UUID
   */
  async resumeTask(taskId: string): Promise<void> {
    if (!this.executionEngine.isEngineRunning()) {
      throw new Error('Execution engine is not running');
    }

    await this.executionEngine.resumeTask(taskId);
  }

  /**
   * 立即执行任务（手动触发）
   * 
   * @param taskId 任务 UUID
   */
  async runTaskNow(taskId: string): Promise<void> {
    if (!this.executionEngine.isEngineRunning()) {
      throw new Error('Execution engine is not running');
    }

    await this.executionEngine.runTask(taskId);
  }

  /**
   * 获取执行引擎状态
   */
  getEngineStatus(): {
    isRunning: boolean;
    activeTasksCount: number;
  } {
    return {
      isRunning: this.executionEngine.isEngineRunning(),
      activeTasksCount: this.executionEngine.getActiveTasks().length,
    };
  }

  /**
   * 获取活跃任务列表
   */
  getActiveTasks(): ScheduleTask[] {
    return this.executionEngine.getActiveTasks();
  }
}
