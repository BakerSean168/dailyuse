import { createLogger } from '@dailyuse/utils';

/**
 * 调度任务执行统计
 */
export interface ScheduleExecutionStats {
  /** 总执行次�?*/
  totalExecutions: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 跳过次数 */
  skippedCount: number;
  /** 平均执行时长（毫秒） */
  avgExecutionTime: number;
  /** 最后执行时�?*/
  lastExecutionTime: Date | null;
  /** 最后成功时�?*/
  lastSuccessTime: Date | null;
  /** 最后失败时�?*/
  lastFailureTime: Date | null;
}

/**
 * 任务执行记录
 */
interface ExecutionRecord {
  taskUuid: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'success' | 'failure';
  error?: Error;
}

/**
 * 调度任务监控服务
 * 
 * 职责:
 * 1. 收集任务执行统计信息
 * 2. 记录任务执行历史
 * 3. 提供性能指标查询
 * 4. 异常告警
 */
export class ScheduleMonitor {
  private static instance: ScheduleMonitor | null = null;
  private logger: ReturnType<typeof createLogger>;
  
  /** 任务统计信息 Map<taskUuid, stats> */
  private taskStats: Map<string, ScheduleExecutionStats> = new Map();

  /** 当前正在执行的任�?Map<taskUuid, record> */
  private runningTasks: Map<string, ExecutionRecord> = new Map();

  /** 执行历史记录（保留最�?00条） */
  private executionHistory: ExecutionRecord[] = [];
  private readonly MAX_HISTORY = 100;

  /** 全局统计 */
  private globalStats: ScheduleExecutionStats = {
    totalExecutions: 0,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    avgExecutionTime: 0,
    lastExecutionTime: null,
    lastSuccessTime: null,
    lastFailureTime: null,
  };

  private constructor() {
    this.logger = createLogger('ScheduleMonitor');
  }

  public static getInstance(): ScheduleMonitor {
    if (!ScheduleMonitor.instance) {
      ScheduleMonitor.instance = new ScheduleMonitor();
    }
    return ScheduleMonitor.instance;
  }

  /**
   * 记录任务开始执�?
   */
  public recordExecutionStart(taskUuid: string, taskName: string): void {
    const record: ExecutionRecord = {
      taskUuid,
      startTime: new Date(),
      status: 'running',
    };

    this.runningTasks.set(taskUuid, record);

    this.logger.info(`📋 任务开始执行`, {
      taskUuid,
      taskName,
      startTime: record.startTime.toISOString(),
    });
  }

  /**
   * 记录任务执行成功
   */
  public recordExecutionSuccess(taskUuid: string, taskName: string): void {
    const record = this.runningTasks.get(taskUuid);
    if (!record) {
      this.logger.warn(`未找到任务执行记录`, { taskUuid });
      return;
    }

    record.endTime = new Date();
    record.duration = record.endTime.getTime() - record.startTime.getTime();
    record.status = 'success';

    this.runningTasks.delete(taskUuid);
    this.addToHistory(record);
    this.updateStats(taskUuid, 'success', record.duration);

    this.logger.info(`�?任务执行成功`, {
      taskUuid,
      taskName,
      duration: `${record.duration}ms`,
      startTime: record.startTime.toISOString(),
      endTime: record.endTime.toISOString(),
    });
  }

  /**
   * 记录任务执行失败
   */
  public recordExecutionFailure(taskUuid: string, taskName: string, error: Error): void {
    const record = this.runningTasks.get(taskUuid);
    if (!record) {
      this.logger.warn(`未找到任务执行记录`, { taskUuid });
      return;
    }

    record.endTime = new Date();
    record.duration = record.endTime.getTime() - record.startTime.getTime();
    record.status = 'failure';
    record.error = error;

    this.runningTasks.delete(taskUuid);
    this.addToHistory(record);
    this.updateStats(taskUuid, 'failure', record.duration);

    this.logger.error(`�?任务执行失败`, {
      taskUuid,
      taskName,
      duration: `${record.duration}ms`,
      error: error.message,
      stack: error.stack,
    });

    // 失败告警
    this.alertOnFailure(taskUuid, taskName, error);
  }

  /**
   * 记录任务跳过
   */
  public recordExecutionSkipped(taskUuid: string, taskName: string, reason: string): void {
    this.updateStats(taskUuid, 'skipped', 0);

    this.logger.warn(`⏭️ 任务跳过执行`, {
      taskUuid,
      taskName,
      reason,
    });
  }

  /**
   * 获取任务统计信息
   */
  public getTaskStats(taskUuid: string): ScheduleExecutionStats | undefined {
    return this.taskStats.get(taskUuid);
  }

  /**
   * 获取全局统计信息
   */
  public getGlobalStats(): ScheduleExecutionStats {
    return { ...this.globalStats };
  }

  /**
   * 获取正在执行的任务列�?
   */
  public getRunningTasks(): ExecutionRecord[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * 获取执行历史记录
   */
  public getExecutionHistory(limit: number = 20): ExecutionRecord[] {
    return this.executionHistory.slice(0, limit);
  }

  /**
   * 打印监控报告
   */
  public printMonitorReport(): void {
    const runningCount = this.runningTasks.size;
    const stats = this.globalStats;

    this.logger.info('📊 调度任务监控报告', {
      正在执行: runningCount,
      总执行次�? stats.totalExecutions,
      成功次数: stats.successCount,
      失败次数: stats.failureCount,
      跳过次数: stats.skippedCount,
      成功�? stats.totalExecutions > 0 ? `${((stats.successCount / stats.totalExecutions) * 100).toFixed(2)}%` : '0%',
      平均执行时长: `${stats.avgExecutionTime.toFixed(2)}ms`,
      最后执行时�? stats.lastExecutionTime?.toISOString() || 'N/A',
    });

    // 打印正在执行的任�?
    if (runningCount > 0) {
      this.logger.info(`当前正在执行的任�?(${runningCount}):`, {
        tasks: Array.from(this.runningTasks.values()).map((record) => ({
          taskUuid: record.taskUuid,
          startTime: record.startTime.toISOString(),
          runningTime: `${Date.now() - record.startTime.getTime()}ms`,
        })),
      });
    }

    // 打印任务级统�?
    if (this.taskStats.size > 0) {
      this.logger.info(`任务统计 (�?${this.taskStats.size} 个任�?:`, {
        tasks: Array.from(this.taskStats.entries()).map(([uuid, stat]) => ({
          taskUuid: uuid,
          总执�? stat.totalExecutions,
          成功: stat.successCount,
          失败: stat.failureCount,
          成功�? stat.totalExecutions > 0 ? `${((stat.successCount / stat.totalExecutions) * 100).toFixed(2)}%` : '0%',
          平均时长: `${stat.avgExecutionTime.toFixed(2)}ms`,
        })),
      });
    }
  }

  /**
   * 重置统计信息
   */
  public reset(): void {
    this.taskStats.clear();
    this.runningTasks.clear();
    this.executionHistory = [];
    this.globalStats = {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      avgExecutionTime: 0,
      lastExecutionTime: null,
      lastSuccessTime: null,
      lastFailureTime: null,
    };
    this.logger.info('监控统计已重�?);
  }

  /**
   * 更新统计信息
   */
  private updateStats(taskUuid: string, status: 'success' | 'failure' | 'skipped', duration: number): void {
    // 更新任务级统�?
    let taskStat = this.taskStats.get(taskUuid);
    if (!taskStat) {
      taskStat = {
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        avgExecutionTime: 0,
        lastExecutionTime: null,
        lastSuccessTime: null,
        lastFailureTime: null,
      };
      this.taskStats.set(taskUuid, taskStat);
    }

    const now = new Date();
    taskStat.totalExecutions += 1;
    taskStat.lastExecutionTime = now;

    if (status === 'success') {
      taskStat.successCount += 1;
      taskStat.lastSuccessTime = now;
      taskStat.avgExecutionTime = (taskStat.avgExecutionTime * (taskStat.successCount - 1) + duration) / taskStat.successCount;
    } else if (status === 'failure') {
      taskStat.failureCount += 1;
      taskStat.lastFailureTime = now;
    } else if (status === 'skipped') {
      taskStat.skippedCount += 1;
    }

    // 更新全局统计
    this.globalStats.totalExecutions += 1;
    this.globalStats.lastExecutionTime = now;

    if (status === 'success') {
      this.globalStats.successCount += 1;
      this.globalStats.lastSuccessTime = now;
      this.globalStats.avgExecutionTime =
        (this.globalStats.avgExecutionTime * (this.globalStats.successCount - 1) + duration) / this.globalStats.successCount;
    } else if (status === 'failure') {
      this.globalStats.failureCount += 1;
      this.globalStats.lastFailureTime = now;
    } else if (status === 'skipped') {
      this.globalStats.skippedCount += 1;
    }
  }

  /**
   * 添加到历史记�?
   */
  private addToHistory(record: ExecutionRecord): void {
    this.executionHistory.unshift(record);
    if (this.executionHistory.length > this.MAX_HISTORY) {
      this.executionHistory = this.executionHistory.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * 失败告警
   */
  private alertOnFailure(taskUuid: string, taskName: string, error: Error): void {
    const taskStat = this.taskStats.get(taskUuid);
    if (!taskStat) return;

    // 连续失败告警
    const recentFailures = this.executionHistory
      .filter((r) => r.taskUuid === taskUuid)
      .slice(0, 5)
      .filter((r) => r.status === 'failure').length;

    if (recentFailures >= 3) {
      this.logger.error('🚨 任务连续失败告警', {
        taskUuid,
        taskName,
        连续失败次数: recentFailures,
        总失败次�? taskStat.failureCount,
        最后错�? error.message,
      });
    }

    // 失败率告警（超过50%�?
    if (taskStat.totalExecutions >= 10) {
      const failureRate = taskStat.failureCount / taskStat.totalExecutions;
      if (failureRate > 0.5) {
        this.logger.error('🚨 任务失败率过高告�?, {
          taskUuid,
          taskName,
          失败�? `${(failureRate * 100).toFixed(2)}%`,
          总执�? taskStat.totalExecutions,
          失败: taskStat.failureCount,
        });
      }
    }
  }
}
