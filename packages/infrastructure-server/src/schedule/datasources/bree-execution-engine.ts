/**
 * BreeExecutionEngine - Bree 璋冨害寮曟搸瀹炵幇
 * 
 * 鑱岃矗锛?
 * - 瀹炵幇 IScheduleExecutionEngine 鎺ュ彛
 * - 灏佽 Bree 搴撶殑鍏蜂綋璋冪敤
 * - 灏?ScheduleTask 杞崲涓?Bree JobOptions
 * 
 * 鏋舵瀯浣嶇疆锛氬熀纭€璁炬柦灞傦紙Infrastructure Layer锛?
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
 * Bree 鎵ц寮曟搸閰嶇疆
 */
export interface BreeExecutionEngineConfig {
  /**
   * Worker 鑴氭湰鐩綍璺緞
   */
  workerPath: string;

  /**
   * 鏄惁鍚敤璇︾粏鏃ュ織
   */
  verbose?: boolean;

  /**
   * 榛樿鏃跺尯
   */
  timezone?: string;

  /**
   * Worker 瓒呮椂鏃堕棿锛堟绉掞級
   */
  workerTimeout?: number;
}

/**
 * BreeExecutionEngine - Bree 璋冨害寮曟搸瀹炵幇
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
   * 鍒濆鍖栧苟鍚姩璋冨害寮曟搸
   */
  async start(tasks: ScheduleTask[]): Promise<void> {
    if (this.isRunning) {
      console.warn('鈿狅笍  BreeExecutionEngine is already running');
      return;
    }

    console.log('馃殌 Starting BreeExecutionEngine...');

    // 杞崲浠诲姟涓?Bree job 閰嶇疆
    const jobs: JobOptions[] = tasks.map((task) => this.toJobOptions(task));

    // 鍒濆鍖?Bree
    this.bree = new Bree({
      root: this.config.workerPath,
      jobs,
      defaultExtension: 'js', // Worker 浼氳缂栬瘧涓?JS
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

    // 缁戝畾 'worker created' 浜嬩欢
    this.bree.on('worker created', this.handleTaskStart);

    // 璁板綍娲昏穬浠诲姟
    tasks.forEach((task) => this.activeTasks.set(task.uuid, task));

    // 鍚姩寮曟搸
    await this.bree.start();
    this.isRunning = true;

    console.log(`鉁?BreeExecutionEngine started with ${tasks.length} tasks`);
  }

  /**
   * 鍋滄璋冨害寮曟搸
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.bree) {
      console.warn('鈿狅笍  BreeExecutionEngine is not running');
      return;
    }

    console.log('鈴癸笍  Stopping BreeExecutionEngine...');

    // 瑙ｇ粦浜嬩欢
    if (this.bree) {
      this.bree.off('worker created', this.handleTaskStart);
    }

    await this.bree.stop();
    this.bree = null;
    this.isRunning = false;
    this.activeTasks.clear();

    console.log('鉁?BreeExecutionEngine stopped');
  }

  /**
   * 娣诲姞鏂扮殑璋冨害浠诲姟
   */
  async addTask(task: ScheduleTask): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    // 妫€鏌ヤ换鍔＄姸鎬?
    if (task.status !== 'active') {
      console.warn(`鈿狅笍  Task ${task.uuid} is not active, skipping`);
      return;
    }

    // 娣诲姞鍒?Bree
    const jobOptions = this.toJobOptions(task);
    await this.bree.add(jobOptions);
    await this.bree.start(task.uuid);

    // 璁板綍娲昏穬浠诲姟
    this.activeTasks.set(task.uuid, task);

    console.log(`鉁?Added task ${task.uuid} to execution engine`);
  }

  /**
   * 绉婚櫎璋冨害浠诲姟
   */
  async removeTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    // 浠?Bree 绉婚櫎
    await this.bree.remove(taskId);

    // 浠庢椿璺冧换鍔＄Щ闄?
    this.activeTasks.delete(taskId);

    console.log(`鉁?Removed task ${taskId} from execution engine`);
  }

  /**
   * 鏆傚仠浠诲姟
   */
  async pauseTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.stop(taskId);
    console.log(`鈴革笍  Paused task ${taskId}`);
  }

  /**
   * 鎭㈠浠诲姟
   */
  async resumeTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.start(taskId);
    console.log(`鈻讹笍  Resumed task ${taskId}`);
  }

  /**
   * 绔嬪嵆鎵ц浠诲姟锛堝拷鐣ヨ皟搴︽椂闂达級
   */
  async runTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.run(taskId);
    console.log(`馃弮 Manually triggered task ${taskId}`);
  }

  /**
   * 鑾峰彇娲昏穬浠诲姟鍒楄〃
   */
  getActiveTasks(): ScheduleTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 妫€鏌ュ紩鎿庢槸鍚﹁繍琛屼腑
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 灏?ScheduleTask 杞崲涓?Bree JobOptions
   */
  private toJobOptions(task: ScheduleTask): JobOptions {
    const scheduleConfig = task.schedule;
    const retryPolicy = task.retryPolicy;

    // 浠?task 涓幏鍙?job name锛堜紭鍏堜娇鐢?metadata payload 鐨勫悕绉帮紝鍏舵浠诲姟鍚嶇О锛?
    const metadata = task.metadata;
    const jobName =
      (metadata.payload && metadata.payload.name) || task.name || task.sourceModule;

    // 鏋勫缓鎵ц涓婁笅鏂?
    const context = {
      job: {
        name: jobName,
        data: {
          [`${task.sourceModule}Id`]: task.sourceEntityId,
          accountUuid: task.accountUuid,
        },
      },
    };

    // 鍩虹閰嶇疆
    const jobOptions: JobOptions = {
      name: task.uuid, // 浣跨敤 task.uuid 浣滀负 bree 鐨?job name
      path: path.join(this.config.workerPath, 'schedule-worker.js'),
      worker: {
        workerData: context,
      },
      timeout: this.config.workerTimeout ?? 60000, // 榛樿 60 绉?
    };

    // 璋冨害閰嶇疆
    const dto = scheduleConfig.toServerDTO();

    if (dto.cronExpression) {
      // Cron 琛ㄨ揪寮忚皟搴?
      jobOptions.cron = dto.cronExpression;
    }
    // Note: intervalMs and date scheduling are not currently supported in ScheduleConfigServerDTO
    // They would need to be added to the contracts if needed

    // 鏃跺尯
    if (dto.timezone) {
      jobOptions.timezone = dto.timezone;
    }

    return jobOptions;
  }

  /**
   * 澶勭悊浠诲姟鍚姩
   */
  private handleTaskStart(workerName: string): void {
    this.taskStartTimes.set(workerName, Date.now());
    console.log(`馃殌 Worker for task ${workerName} created.`);
  }

  /**
   * 澶勭悊 Worker 閿欒
   */
  private async handleError(error: Error, workerMetadata?: any): Promise<void> {
    const taskId = workerMetadata?.name;
    if (!taskId) {
      console.error('鉂?Worker error with unknown task:', error);
      return;
    }

    console.error(`鉂?Worker error for task ${taskId}:`, error);

    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found in active tasks.`);
      return;
    }

    const startTime = this.taskStartTimes.get(taskId) ?? Date.now();
    const duration = Date.now() - startTime;

    // 鑾峰彇涓婁竴娆＄殑鎵ц璁板綍
    const previousExecutions = await this.executionRepository.findByTaskUuid(taskId);
    const lastExecution = previousExecutions.sort((a, b) => b.executionTime - a.executionTime)[0];
    const currentRetryCount = lastExecution ? lastExecution.retryCount : 0;

    let execution: ScheduleExecution;

    // 妫€鏌ユ槸鍚﹀彲浠ラ噸璇?
    if (task.retryPolicy.shouldRetry(currentRetryCount)) {
      const nextRetryCount = currentRetryCount + 1;
      const delay = task.retryPolicy.calculateNextRetryDelay(nextRetryCount);
      
      console.log(`馃攣 Task ${taskId} failed. Retrying in ${delay}ms (attempt ${nextRetryCount}).`);

      execution = ScheduleExecution.create({
        taskUuid: taskId,
        executionTime: startTime,
        status: ExecutionStatus.RETRYING,
      });
      execution.incrementRetry(); // This will set retryCount to 1 on first retry
      
      // 鍒涘缓涓€涓竴娆℃€х殑閲嶈瘯浠诲姟
      const retryJobName = `${taskId}-retry-${nextRetryCount}-${Date.now()}`;
      const jobOptions = this.toJobOptions(task);
      
      if (jobOptions.worker) {
        const retryJob: JobOptions = {
          ...jobOptions,
          name: retryJobName,
          date: new Date(Date.now() + delay),
          // 娓呴櫎 cron 鍜?interval锛岀‘淇濆彧鎵ц涓€娆?
          cron: undefined, 
          interval: undefined,
          worker: {
            ...jobOptions.worker,
            workerData: {
              ...jobOptions.worker.workerData,
              __retryCount: nextRetryCount, // 浼犻€掗噸璇曟鏁?
            }
          }
        };

        if (this.bree) {
          await this.bree.add(retryJob);
          await this.bree.start(retryJobName);
        }
      } else {
         console.error(`鉂?Cannot retry task ${taskId} because jobOptions.worker is not defined.`);
      }

    } else {
      console.log(`馃毇 Max retries reached for task ${taskId}. Marking as FAILED.`);
      execution = ScheduleExecution.create({
        taskUuid: taskId,
        executionTime: startTime,
        status: ExecutionStatus.FAILED,
      });
      task.fail(error.message);
      // TODO: 淇濆瓨 task 鐘舵€?
    }
    
    execution.markFailed(error.message, duration);

    try {
      await this.executionRepository.save(execution);
      console.log(`馃捑 Saved ${execution.status} execution record for task ${taskId}`);
    } catch (repoError) {
      console.error(`鉂?Failed to save execution record for task ${taskId}:`, repoError);
    }

    this.taskStartTimes.delete(taskId);
  }

  /**
   * 澶勭悊 Worker 娑堟伅
   */
  private async handleWorkerMessage(message: any, workerMetadata?: any): Promise<void> {
    const taskId = workerMetadata?.name;
    if (!taskId) {
      console.error('馃摠 Worker message from unknown task:', message);
      return;
    }

    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found in active tasks.`);
      return;
    }

    console.log(`馃摠 Worker message for task ${taskId}:`, message);

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
      // 濡傛灉鏄叾浠栭敊璇秷鎭?
      const errorMessage = message instanceof Error ? message.message : JSON.stringify(message);
      execution.markFailed(errorMessage, duration);
      task.recordExecution(ExecutionStatus.FAILED, duration, undefined, errorMessage);
    }

    try {
      await this.executionRepository.save(execution);
      console.log(`馃捑 Saved execution record for task ${taskId}`);
      // TODO: 淇濆瓨 task 鐘舵€?
    } catch (repoError) {
      console.error(`鉂?Failed to save execution record for task ${taskId}:`, repoError);
    }

    this.taskStartTimes.delete(taskId);
  }
}
