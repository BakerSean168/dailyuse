/**
 * BreeExecutionEngine - Bree 调度引擎实现
 * 
 * 职责：
 * - 实现 IScheduleExecutionEngine 接口
 * - 封装 Bree 库的具体调用
 * - 将 ScheduleTask 转换为 Bree JobOptions
 * 
 * 架构位置：基础设施层（Infrastructure Layer）
 */

import Bree from 'bree';
import type { JobOptions } from 'bree';
import path from 'path';
import {
  type IScheduleExecutionEngine,
  type TaskExecutionContext,
  ScheduleTask,
  type IScheduleExecutionRepository,
  ScheduleExecution,
} from '@dailyuse/domain-server/schedule';
import { ExecutionStatus } from '@dailyuse/contracts/schedule';

/**
 * Bree 执行引擎配置
 */
export interface BreeExecutionEngineConfig {
  /**
   * Worker 脚本目录路径
   */
  workerPath: string;

  /**
   * 是否启用详细日志
   */
  verbose?: boolean;

  /**
   * 默认时区
   */
  timezone?: string;

  /**
   * Worker 超时时间（毫秒）
   */
  workerTimeout?: number;
}

/**
 * BreeExecutionEngine - Bree 调度引擎实现
 */
export class BreeExecutionEngine implements IScheduleExecutionEngine {
  private bree: Bree | null = null;
  private config: BreeExecutionEngineConfig;
  private isRunning = false;
  private activeTasks = new Map<string, ScheduleTask>();
  private executionRepository: IScheduleExecutionRepository;
  private taskStartTimes = new Map<string, number>();

  constructor(
    config: BreeExecutionEngineConfig,
    executionRepository: IScheduleExecutionRepository,
  ) {
    this.config = config;
    this.executionRepository = executionRepository;

    // Bind 'this' to handlers
    this.handleWorkerMessage = this.handleWorkerMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleTaskStart = this.handleTaskStart.bind(this);
  }

  /**
   * 初始化并启动调度引擎
   */
  async start(tasks: ScheduleTask[]): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️  BreeExecutionEngine is already running');
      return;
    }

    console.log('🚀 Starting BreeExecutionEngine...');

    // 转换任务为 Bree job 配置
    const jobs: JobOptions[] = tasks.map((task) => this.toJobOptions(task));

    // 初始化 Bree
    this.bree = new Bree({
      root: this.config.workerPath,
      jobs,
      defaultExtension: 'js', // Worker 会被编译为 JS
      timezone: this.config.timezone ?? 'Asia/Shanghai',
      errorHandler: this.handleError,
      workerMessageHandler: this.handleWorkerMessage,
      logger: this.config.verbose
        ? console
        : {
            info: () => {},
            warn: console.warn,
            error: console.error,
          },
      outputWorkerMetadata: true,
    });

    // 绑定 'worker created' 事件
    this.bree.on('worker created', this.handleTaskStart);

    // 记录活跃任务
    tasks.forEach((task) => this.activeTasks.set(task.uuid, task));

    // 启动引擎
    await this.bree.start();
    this.isRunning = true;

    console.log(`✅ BreeExecutionEngine started with ${tasks.length} tasks`);
  }

  /**
   * 停止调度引擎
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.bree) {
      console.warn('⚠️  BreeExecutionEngine is not running');
      return;
    }

    console.log('⏹️  Stopping BreeExecutionEngine...');

    // 解绑事件
    if (this.bree) {
      this.bree.off('worker created', this.handleTaskStart);
    }

    await this.bree.stop();
    this.bree = null;
    this.isRunning = false;
    this.activeTasks.clear();

    console.log('✅ BreeExecutionEngine stopped');
  }

  /**
   * 添加新的调度任务
   */
  async addTask(task: ScheduleTask): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    // 检查任务状态
    if (task.status !== 'active') {
      console.warn(`⚠️  Task ${task.uuid} is not active, skipping`);
      return;
    }

    // 添加到 Bree
    const jobOptions = this.toJobOptions(task);
    await this.bree.add(jobOptions);
    await this.bree.start(task.uuid);

    // 记录活跃任务
    this.activeTasks.set(task.uuid, task);

    console.log(`✅ Added task ${task.uuid} to execution engine`);
  }

  /**
   * 移除调度任务
   */
  async removeTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    // 从 Bree 移除
    await this.bree.remove(taskId);

    // 从活跃任务移除
    this.activeTasks.delete(taskId);

    console.log(`✅ Removed task ${taskId} from execution engine`);
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.stop(taskId);
    console.log(`⏸️  Paused task ${taskId}`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.start(taskId);
    console.log(`▶️  Resumed task ${taskId}`);
  }

  /**
   * 立即执行任务（忽略调度时间）
   */
  async runTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.run(taskId);
    console.log(`🏃 Manually triggered task ${taskId}`);
  }

  /**
   * 获取活跃任务列表
   */
  getActiveTasks(): ScheduleTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 检查引擎是否运行中
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 将 ScheduleTask 转换为 Bree JobOptions
   */
  private toJobOptions(task: ScheduleTask): JobOptions {
    const scheduleConfig = task.schedule;
    const retryPolicy = task.retryPolicy;

    // 从 task 中获取 job name（优先使用 metadata payload 的名称，其次任务名称）
    const metadata = task.metadata;
    const jobName =
      (metadata.payload && metadata.payload.name) || task.name || task.sourceModule;

    // 构建执行上下文
    const context = {
      job: {
        name: jobName,
        data: {
          [`${task.sourceModule}Id`]: task.sourceEntityId,
          accountUuid: task.accountUuid,
        },
      },
    };

    // 基础配置
    const jobOptions: JobOptions = {
      name: task.uuid, // 使用 task.uuid 作为 bree 的 job name
      path: path.join(this.config.workerPath, 'schedule-worker.js'),
      worker: {
        workerData: context,
      },
      timeout: this.config.workerTimeout ?? 60000, // 默认 60 秒
    };

    // 调度配置
    const dto = scheduleConfig.toServerDTO();

    if (dto.cronExpression) {
      // Cron 表达式调度
      jobOptions.cron = dto.cronExpression;
    }
    // Note: intervalMs and date scheduling are not currently supported in ScheduleConfigServerDTO
    // They would need to be added to the contracts if needed

    // 时区
    if (dto.timezone) {
      jobOptions.timezone = dto.timezone;
    }

    return jobOptions;
  }

  /**
   * 处理任务启动
   */
  private handleTaskStart(workerName: string): void {
    this.taskStartTimes.set(workerName, Date.now());
    console.log(`🚀 Worker for task ${workerName} created.`);
  }

  /**
   * 处理 Worker 错误
   */
  private async handleError(error: Error, workerMetadata?: any): Promise<void> {
    const taskId = workerMetadata?.name;
    if (!taskId) {
      console.error('❌ Worker error with unknown task:', error);
      return;
    }

    console.error(`❌ Worker error for task ${taskId}:`, error);

    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found in active tasks.`);
      return;
    }

    const startTime = this.taskStartTimes.get(taskId) ?? Date.now();
    const duration = Date.now() - startTime;

    // 获取上一次的执行记录
    const previousExecutions = await this.executionRepository.findByTaskUuid(taskId);
    const lastExecution = previousExecutions.sort((a, b) => b.executionTime - a.executionTime)[0];
    const currentRetryCount = lastExecution ? lastExecution.retryCount : 0;

    let execution: ScheduleExecution;

    // 检查是否可以重试
    if (task.retryPolicy.shouldRetry(currentRetryCount)) {
      const nextRetryCount = currentRetryCount + 1;
      const delay = task.retryPolicy.calculateNextRetryDelay(nextRetryCount);
      
      console.log(`🔁 Task ${taskId} failed. Retrying in ${delay}ms (attempt ${nextRetryCount}).`);

      execution = ScheduleExecution.create({
        taskUuid: taskId,
        executionTime: startTime,
        status: ExecutionStatus.RETRYING,
      });
      execution.incrementRetry(); // This will set retryCount to 1 on first retry
      
      // 创建一个一次性的重试任务
      const retryJobName = `${taskId}-retry-${nextRetryCount}-${Date.now()}`;
      const jobOptions = this.toJobOptions(task);
      
      if (jobOptions.worker) {
        const retryJob: JobOptions = {
          ...jobOptions,
          name: retryJobName,
          date: new Date(Date.now() + delay),
          // 清除 cron 和 interval，确保只执行一次
          cron: undefined, 
          interval: undefined,
          worker: {
            ...jobOptions.worker,
            workerData: {
              ...jobOptions.worker.workerData,
              __retryCount: nextRetryCount, // 传递重试次数
            }
          }
        };

        if (this.bree) {
          await this.bree.add(retryJob);
          await this.bree.start(retryJobName);
        }
      } else {
         console.error(`❌ Cannot retry task ${taskId} because jobOptions.worker is not defined.`);
      }

    } else {
      console.log(`🚫 Max retries reached for task ${taskId}. Marking as FAILED.`);
      execution = ScheduleExecution.create({
        taskUuid: taskId,
        executionTime: startTime,
        status: ExecutionStatus.FAILED,
      });
      task.fail(error.message);
      // TODO: 保存 task 状态
    }
    
    execution.markFailed(error.message, duration);

    try {
      await this.executionRepository.save(execution);
      console.log(`💾 Saved ${execution.status} execution record for task ${taskId}`);
    } catch (repoError) {
      console.error(`❌ Failed to save execution record for task ${taskId}:`, repoError);
    }

    this.taskStartTimes.delete(taskId);
  }

  /**
   * 处理 Worker 消息
   */
  private async handleWorkerMessage(message: any, workerMetadata?: any): Promise<void> {
    const taskId = workerMetadata?.name;
    if (!taskId) {
      console.error('📨 Worker message from unknown task:', message);
      return;
    }

    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found in active tasks.`);
      return;
    }

    console.log(`📨 Worker message for task ${taskId}:`, message);

    const startTime = this.taskStartTimes.get(taskId) ?? Date.now();
    const duration = Date.now() - startTime;

    const execution = ScheduleExecution.create({
      taskUuid: taskId,
      executionTime: startTime,
    });

    if (message === 'done') {
      execution.markSuccess(duration, { result: 'done' });
      task.recordExecution(ExecutionStatus.SUCCESS, duration, { result: 'done' });
    } else {
      // 如果是其他错误消息
      const errorMessage = message instanceof Error ? message.message : JSON.stringify(message);
      execution.markFailed(errorMessage, duration);
      task.recordExecution(ExecutionStatus.FAILED, duration, undefined, errorMessage);
    }

    try {
      await this.executionRepository.save(execution);
      console.log(`💾 Saved execution record for task ${taskId}`);
      // TODO: 保存 task 状态
    } catch (repoError) {
      console.error(`❌ Failed to save execution record for task ${taskId}:`, repoError);
    }

    this.taskStartTimes.delete(taskId);
  }
}
