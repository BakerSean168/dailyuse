/**
 * DesktopScheduler - Desktop 调度器
 *
 * 包装 ScheduleTaskQueue，并集成 Electron 特有功能：
 * - PowerMonitor：处理系统休眠/恢复
 * - 应用生命周期管理
 *
 * @module desktop/main/modules/schedule/infrastructure
 */

import { powerMonitor } from 'electron';
import {
  ScheduleTaskQueue,
  NodeTimer,
  type ScheduledItem,
  type ScheduleTaskQueueStatus,
  type IScheduleTaskLoader,
} from '@dailyuse/schedule/application-server';
import { DesktopScheduleMonitor } from './DesktopScheduleMonitor';

/**
 * Desktop 调度器配置
 */
export interface DesktopSchedulerConfig {
  /** 任务加载器 */
  taskLoader?: IScheduleTaskLoader;
  /** 执行任务的回调 */
  onExecuteTask: (taskUuid: string, item: ScheduledItem) => Promise<void>;
  /** 执行错误回调（可选） */
  onExecuteError?: (taskUuid: string, error: Error) => void;
}

/**
 * Desktop 调度器状态
 */
export interface DesktopSchedulerStatus extends ScheduleTaskQueueStatus {
  stats: ReturnType<DesktopScheduleMonitor['getStats']>;
}

/**
 * Desktop 调度器
 *
 * 单例模式，整个应用只有一个调度器实例
 */
export class DesktopScheduler {
  private static instance: DesktopScheduler | null = null;
  private queue: ScheduleTaskQueue;
  private monitor: DesktopScheduleMonitor;
  private powerMonitorInitialized = false;

  private constructor(config: DesktopSchedulerConfig) {
    this.monitor = DesktopScheduleMonitor.getInstance();

    this.queue = new ScheduleTaskQueue({
      timer: new NodeTimer(),
      taskLoader: config.taskLoader,
      monitor: this.monitor,
      onExecuteTask: config.onExecuteTask,
      onExecuteError: config.onExecuteError,
      logger: {
        debug: (msg, meta) =>
          console.debug(`[DesktopScheduler] ${msg}`, meta ?? ''),
        info: (msg, meta) =>
          console.info(`[DesktopScheduler] ${msg}`, meta ?? ''),
        warn: (msg, meta) =>
          console.warn(`[DesktopScheduler] ${msg}`, meta ?? ''),
        error: (msg, meta) =>
          console.error(`[DesktopScheduler] ${msg}`, meta ?? ''),
      },
    });
  }

  /**
   * 创建实例（必须先调用此方法）
   */
  static createInstance(config: DesktopSchedulerConfig): DesktopScheduler {
    if (DesktopScheduler.instance) {
      console.warn('[DesktopScheduler] Instance already exists, returning existing');
      return DesktopScheduler.instance;
    }
    DesktopScheduler.instance = new DesktopScheduler(config);
    return DesktopScheduler.instance;
  }

  /**
   * 获取实例
   */
  static getInstance(): DesktopScheduler {
    if (!DesktopScheduler.instance) {
      throw new Error(
        '[DesktopScheduler] Instance not created. Call createInstance first.'
      );
    }
    return DesktopScheduler.instance;
  }

  /**
   * 检查实例是否存在
   */
  static hasInstance(): boolean {
    return DesktopScheduler.instance !== null;
  }

  /**
   * 销毁实例
   */
  static destroyInstance(): void {
    if (DesktopScheduler.instance) {
      DesktopScheduler.instance.stop();
      DesktopScheduler.instance = null;
    }
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    console.info('[DesktopScheduler] Starting...');
    
    // 设置 Electron PowerMonitor
    this.setupPowerMonitor();
    
    await this.queue.start();
    
    console.info('[DesktopScheduler] Started successfully');
  }

  /**
   * 停止调度器
   */
  stop(): void {
    console.info('[DesktopScheduler] Stopping...');
    this.queue.stop();
    console.info('[DesktopScheduler] Stopped');
  }

  /**
   * 添加任务到队列
   */
  addTask(item: ScheduledItem): void {
    this.queue.addTask(item);
  }

  /**
   * 从队列中移除任务
   */
  removeTask(taskUuid: string): boolean {
    return this.queue.removeTask(taskUuid);
  }

  /**
   * 更新任务的执行时间
   */
  updateTaskSchedule(taskUuid: string, newNextRunAt: number): boolean {
    return this.queue.updateTaskSchedule(taskUuid, newNextRunAt);
  }

  /**
   * 暂停任务
   */
  pauseTask(taskUuid: string): boolean {
    return this.queue.pauseTask(taskUuid);
  }

  /**
   * 恢复任务
   */
  resumeTask(item: ScheduledItem): void {
    this.queue.resumeTask(item);
  }

  /**
   * 检查任务是否在队列中
   */
  hasTask(taskUuid: string): boolean {
    return this.queue.hasTask(taskUuid);
  }

  /**
   * 获取队列中的所有任务
   */
  getQueuedTasks(): ScheduledItem[] {
    return this.queue.getQueuedTasks();
  }

  /**
   * 检查并执行错过的任务（用于系统休眠恢复）
   */
  async checkMissedTasks(): Promise<{ executed: number; failed: number }> {
    return this.queue.checkMissedTasks();
  }

  /**
   * 获取调度器状态
   */
  getStatus(): DesktopSchedulerStatus {
    return {
      ...this.queue.getStatus(),
      stats: this.monitor.getStats(),
    };
  }

  /**
   * 获取监控实例
   */
  getMonitor(): DesktopScheduleMonitor {
    return this.monitor;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue.clear();
  }

  // ===== Private Methods =====

  /**
   * 设置 Electron PowerMonitor
   * 处理系统休眠/恢复
   */
  private setupPowerMonitor(): void {
    if (this.powerMonitorInitialized) {
      return;
    }

    // 系统休眠后恢复时，检查错过的任务
    powerMonitor.on('resume', async () => {
      console.info('[DesktopScheduler] System resumed from sleep, checking missed tasks...');
      try {
        const result = await this.queue.checkMissedTasks();
        console.info('[DesktopScheduler] Missed tasks check completed:', result);
      } catch (error) {
        console.error('[DesktopScheduler] Failed to check missed tasks:', error);
      }
    });

    // 系统即将休眠时记录日志
    powerMonitor.on('suspend', () => {
      console.info('[DesktopScheduler] System suspending, scheduler will pause...');
    });

    // 系统锁屏/解锁（可选：用于调整执行策略）
    powerMonitor.on('lock-screen', () => {
      console.debug('[DesktopScheduler] Screen locked');
    });

    powerMonitor.on('unlock-screen', () => {
      console.debug('[DesktopScheduler] Screen unlocked');
    });

    this.powerMonitorInitialized = true;
    console.info('[DesktopScheduler] PowerMonitor handlers registered');
  }
}
