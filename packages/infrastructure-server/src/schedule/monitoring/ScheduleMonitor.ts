/**
 * Schedule Monitor
 * 调度监控
 *
 * 职责�?
 * - 监控定时任务执行状�?
 * - 记录任务执行时间和结�?
 * - 提供性能指标收集
 *
 * @module Schedule/Infrastructure/Monitoring
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleMonitor');

interface TaskExecutionMetrics {
  taskUuid: string;
  executedAt: number;
  duration: number;
  success: boolean;
  error?: Error;
}

/**
 * 调度监控�?
 */
export class ScheduleMonitor {
  private static instance: ScheduleMonitor;
  private executionMetrics: TaskExecutionMetrics[] = [];
  private readonly maxMetrics = 1000; // 最多保�?1000 条记�?

  private constructor() {}

  public static getInstance(): ScheduleMonitor {
    if (!ScheduleMonitor.instance) {
      ScheduleMonitor.instance = new ScheduleMonitor();
    }
    return ScheduleMonitor.instance;
  }

  /**
   * 记录任务执行
   */
  recordExecution(metrics: TaskExecutionMetrics): void {
    this.executionMetrics.push(metrics);

    // 保持内存中的指标数量在可控范�?
    if (this.executionMetrics.length > this.maxMetrics) {
      this.executionMetrics.shift();
    }

    if (metrics.success) {
      logger.info(`Task ${metrics.taskUuid} executed successfully in ${metrics.duration}ms`);
    } else {
      logger.error(
        `Task ${metrics.taskUuid} failed after ${metrics.duration}ms`,
        metrics.error,
      );
    }
  }

  /**
   * 获取任务的执行历�?
   */
  getTaskHistory(taskUuid: string, limit: number = 10): TaskExecutionMetrics[] {
    return this.executionMetrics
      .filter((m) => m.taskUuid === taskUuid)
      .slice(-limit);
  }

  /**
   * 获取最近执行的任务
   */
  getRecentExecutions(limit: number = 10): TaskExecutionMetrics[] {
    return this.executionMetrics.slice(-limit);
  }

  /**
   * 获取执行成功�?
   */
  getSuccessRate(): number {
    if (this.executionMetrics.length === 0) return 0;
    const successful = this.executionMetrics.filter((m) => m.success).length;
    return (successful / this.executionMetrics.length) * 100;
  }

  /**
   * 清空指标
   */
  clearMetrics(): void {
    this.executionMetrics = [];
  }
}
