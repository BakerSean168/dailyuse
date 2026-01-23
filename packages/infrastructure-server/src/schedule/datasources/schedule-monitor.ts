import { createLogger } from '@dailyuse/utils';

/**
 * Schedule Task Execution Statistics
 */
export interface ScheduleExecutionStats {
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successCount: number;
  /** Failed executions */
  failureCount: number;
  /** Skipped executions */
  skippedCount: number;
  /** Average execution time (milliseconds) */
  avgExecutionTime: number;
  /** Last execution time */
  lastExecutionTime: Date | null;
  /** Last successful execution time */
  lastSuccessTime: Date | null;
  /** Last failure time */
  lastFailureTime: Date | null;
}

/**
 * Task Execution Record
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
 * Schedule Task Monitoring Service
 *
 * Responsibilities:
 * 1. Collect task execution statistics
 * 2. Record task execution history
 * 3. Provide performance metrics queries
 * 4. Alert on exceptions
 */
export class ScheduleMonitor {
  private static instance: ScheduleMonitor | null = null;
  private logger: ReturnType<typeof createLogger>;

  /** Task statistics mapping <taskUuid, stats> */
  private taskStats: Map<string, ScheduleExecutionStats> = new Map();

  /** Currently running tasks mapping <taskUuid, record> */
  private runningTasks: Map<string, ExecutionRecord> = new Map();

  /** Execution history (keep last 100 records) */
  private executionHistory: ExecutionRecord[] = [];
  private readonly MAX_HISTORY = 100;

  /** Global statistics */
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
   * Record task execution start
   */
  public recordExecutionStart(taskUuid: string, taskName: string): void {
    const record: ExecutionRecord = {
      taskUuid,
      startTime: new Date(),
      status: 'running',
    };

    this.runningTasks.set(taskUuid, record);

    this.logger.info('Task execution started', {
      taskUuid,
      taskName,
      startTime: record.startTime.toISOString(),
    });
  }

  /**
   * Record task execution success
   */
  public recordExecutionSuccess(taskUuid: string, taskName: string): void {
    const record = this.runningTasks.get(taskUuid);
    if (!record) {
      this.logger.warn('Execution record not found', { taskUuid });
      return;
    }

    record.endTime = new Date();
    record.duration = record.endTime.getTime() - record.startTime.getTime();
    record.status = 'success';

    this.runningTasks.delete(taskUuid);
    this.addToHistory(record);
    this.updateStats(taskUuid, 'success', record.duration);

    this.logger.info('Task execution succeeded', {
      taskUuid,
      taskName,
      duration: `${record.duration}ms`,
      startTime: record.startTime.toISOString(),
      endTime: record.endTime.toISOString(),
    });
  }

  /**
   * Record task execution failure
   */
  public recordExecutionFailure(taskUuid: string, taskName: string, error: Error): void {
    const record = this.runningTasks.get(taskUuid);
    if (!record) {
      this.logger.warn('Execution record not found', { taskUuid });
      return;
    }

    record.endTime = new Date();
    record.duration = record.endTime.getTime() - record.startTime.getTime();
    record.status = 'failure';
    record.error = error;

    this.runningTasks.delete(taskUuid);
    this.addToHistory(record);
    this.updateStats(taskUuid, 'failure', record.duration);

    this.logger.error('Task execution failed', {
      taskUuid,
      taskName,
      duration: `${record.duration}ms`,
      error: error.message,
      stack: error.stack,
    });

    // Failure alert
    this.alertOnFailure(taskUuid, taskName, error);
  }

  /**
   * Record task skipped
   */
  public recordExecutionSkipped(taskUuid: string, taskName: string, reason: string): void {
    this.updateStats(taskUuid, 'skipped', 0);

    this.logger.warn('Task execution skipped', {
      taskUuid,
      taskName,
      reason,
    });
  }

  /**
   * Get task statistics
   */
  public getTaskStats(taskUuid: string): ScheduleExecutionStats | undefined {
    return this.taskStats.get(taskUuid);
  }

  /**
   * Get global statistics
   */
  public getGlobalStats(): ScheduleExecutionStats {
    return { ...this.globalStats };
  }

  /**
   * Get list of running tasks
   */
  public getRunningTasks(): ExecutionRecord[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * Get execution history
   */
  public getExecutionHistory(limit: number = 20): ExecutionRecord[] {
    return this.executionHistory.slice(0, limit);
  }

  /**
   * Print monitoring report
   */
  public printMonitorReport(): void {
    const runningCount = this.runningTasks.size;
    const stats = this.globalStats;

    this.logger.info('Schedule Task Monitoring Report', {
      runningCount,
      totalExecutions: stats.totalExecutions,
      successCount: stats.successCount,
      failureCount: stats.failureCount,
      skippedCount: stats.skippedCount,
      successRate: stats.totalExecutions > 0 ? `${((stats.successCount / stats.totalExecutions) * 100).toFixed(2)}%` : '0%',
      avgExecutionTime: `${stats.avgExecutionTime.toFixed(2)}ms`,
      lastExecutionTime: stats.lastExecutionTime?.toISOString() || 'N/A',
    });

    // Print currently running tasks
    if (runningCount > 0) {
      this.logger.info(`Currently running tasks (${runningCount}):`, {
        tasks: Array.from(this.runningTasks.values()).map((record) => ({
          taskUuid: record.taskUuid,
          startTime: record.startTime.toISOString(),
          runningTime: `${Date.now() - record.startTime.getTime()}ms`,
        })),
      });
    }

    // Print task-level statistics
    if (this.taskStats.size > 0) {
      this.logger.info(`Task Statistics (${this.taskStats.size} tasks):`, {
        tasks: Array.from(this.taskStats.entries()).map(([uuid, stat]) => ({
          taskUuid: uuid,
          totalExecutions: stat.totalExecutions,
          successCount: stat.successCount,
          failureCount: stat.failureCount,
          successRate: stat.totalExecutions > 0 ? `${((stat.successCount / stat.totalExecutions) * 100).toFixed(2)}%` : '0%',
          avgExecutionTime: `${stat.avgExecutionTime.toFixed(2)}ms`,
        })),
      });
    }
  }

  /**
   * Reset statistics
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
    this.logger.info('Monitoring statistics reset');
  }

  /**
   * Update statistics
   */
  private updateStats(taskUuid: string, status: 'success' | 'failure' | 'skipped', duration: number): void {
    // Update task-level statistics
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
      taskStat.avgExecutionTime =
        (taskStat.avgExecutionTime * (taskStat.successCount - 1) + duration) / taskStat.successCount;
    } else if (status === 'failure') {
      taskStat.failureCount += 1;
      taskStat.lastFailureTime = now;
    } else if (status === 'skipped') {
      taskStat.skippedCount += 1;
    }

    // Update global statistics
    this.globalStats.totalExecutions += 1;
    this.globalStats.lastExecutionTime = now;

    if (status === 'success') {
      this.globalStats.successCount += 1;
      this.globalStats.lastSuccessTime = now;
      this.globalStats.avgExecutionTime =
        (this.globalStats.avgExecutionTime * (this.globalStats.successCount - 1) + duration) /
        this.globalStats.successCount;
    } else if (status === 'failure') {
      this.globalStats.failureCount += 1;
      this.globalStats.lastFailureTime = now;
    } else if (status === 'skipped') {
      this.globalStats.skippedCount += 1;
    }
  }

  /**
   * Add to execution history
   */
  private addToHistory(record: ExecutionRecord): void {
    this.executionHistory.unshift(record);
    if (this.executionHistory.length > this.MAX_HISTORY) {
      this.executionHistory = this.executionHistory.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Alert on failure
   */
  private alertOnFailure(taskUuid: string, taskName: string, error: Error): void {
    const taskStat = this.taskStats.get(taskUuid);
    if (!taskStat) return;

    // Consecutive failure alert
    const recentFailures = this.executionHistory
      .filter((r) => r.taskUuid === taskUuid)
      .slice(0, 5)
      .filter((r) => r.status === 'failure').length;

    if (recentFailures >= 3) {
      this.logger.error('Consecutive task failures alert', {
        taskUuid,
        taskName,
        consecutiveFailures: recentFailures,
        totalFailures: taskStat.failureCount,
        lastError: error.message,
      });
    }

    // High failure rate alert (> 50%)
    if (taskStat.totalExecutions >= 10) {
      const failureRate = taskStat.failureCount / taskStat.totalExecutions;
      if (failureRate > 0.5) {
        this.logger.error('High task failure rate alert', {
          taskUuid,
          taskName,
          failureRate: `${(failureRate * 100).toFixed(2)}%`,
          totalExecutions: taskStat.totalExecutions,
          failureCount: taskStat.failureCount,
        });
      }
    }
  }
}
