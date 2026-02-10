/**
 * DesktopScheduleMonitor - Desktop 调度监控
 *
 * 实现 IScheduleMonitor 接口，提供 Desktop 端调度执行的可观测性
 *
 * @module desktop/main/modules/schedule/infrastructure
 */

import type {
  IScheduleMonitor,
  ScheduleExecutionStats,
  ScheduleExecutionRecord,
} from '@dailyuse/schedule/application-server';

/**
 * Desktop 调度监控实现
 */
export class DesktopScheduleMonitor implements IScheduleMonitor {
  private static instance: DesktopScheduleMonitor;

  private stats: ScheduleExecutionStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    skippedExecutions: 0,
    lastExecutionAt: null,
    averageExecutionDuration: 0,
  };

  private records: ScheduleExecutionRecord[] = [];
  private pendingExecutions: Map<string, ScheduleExecutionRecord> = new Map();
  private totalDuration = 0;
  private readonly maxRecords: number;

  private constructor(maxRecords = 100) {
    this.maxRecords = maxRecords;
  }

  static getInstance(): DesktopScheduleMonitor {
    if (!DesktopScheduleMonitor.instance) {
      DesktopScheduleMonitor.instance = new DesktopScheduleMonitor();
    }
    return DesktopScheduleMonitor.instance;
  }

  recordExecutionStart(taskUuid: string, taskName: string): void {
    console.log(`[DesktopScheduleMonitor] ⏰ Task execution started: ${taskName}`);

    const record: ScheduleExecutionRecord = {
      taskUuid,
      taskName,
      startedAt: new Date(),
      status: 'started',
    };
    this.pendingExecutions.set(taskUuid, record);
  }

  recordExecutionSuccess(
    taskUuid: string,
    taskName: string,
    duration?: number
  ): void {
    const pending = this.pendingExecutions.get(taskUuid);
    const now = new Date();

    const record: ScheduleExecutionRecord = pending
      ? {
          ...pending,
          completedAt: now,
          duration: duration ?? now.getTime() - pending.startedAt.getTime(),
          status: 'success',
        }
      : {
          taskUuid,
          taskName,
          startedAt: now,
          completedAt: now,
          duration: duration ?? 0,
          status: 'success',
        };

    this.addRecord(record);
    this.pendingExecutions.delete(taskUuid);

    this.stats.totalExecutions++;
    this.stats.successfulExecutions++;
    this.stats.lastExecutionAt = now;

    if (record.duration !== undefined) {
      this.totalDuration += record.duration;
      this.stats.averageExecutionDuration =
        this.totalDuration / this.stats.totalExecutions;
    }

    console.log(
      `[DesktopScheduleMonitor] ✅ Task executed successfully: ${taskName} (${record.duration}ms)`
    );
  }

  recordExecutionFailure(
    taskUuid: string,
    taskName: string,
    error: Error
  ): void {
    const pending = this.pendingExecutions.get(taskUuid);
    const now = new Date();

    const record: ScheduleExecutionRecord = pending
      ? {
          ...pending,
          completedAt: now,
          duration: now.getTime() - pending.startedAt.getTime(),
          status: 'failure',
          error,
        }
      : {
          taskUuid,
          taskName,
          startedAt: now,
          completedAt: now,
          status: 'failure',
          error,
        };

    this.addRecord(record);
    this.pendingExecutions.delete(taskUuid);

    this.stats.totalExecutions++;
    this.stats.failedExecutions++;
    this.stats.lastExecutionAt = now;

    console.error(
      `[DesktopScheduleMonitor] ❌ Task execution failed: ${taskName}`,
      error.message
    );
  }

  recordExecutionSkipped(
    taskUuid: string,
    taskName: string,
    reason: string
  ): void {
    const now = new Date();

    const record: ScheduleExecutionRecord = {
      taskUuid,
      taskName,
      startedAt: now,
      status: 'skipped',
      reason,
    };

    this.addRecord(record);
    this.stats.skippedExecutions++;

    console.log(
      `[DesktopScheduleMonitor] ⏭️ Task execution skipped: ${taskName} - ${reason}`
    );
  }

  getStats(): ScheduleExecutionStats {
    return { ...this.stats };
  }

  getRecentRecords(limit = 50): ScheduleExecutionRecord[] {
    return this.records.slice(-limit);
  }

  resetStats(): void {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      skippedExecutions: 0,
      lastExecutionAt: null,
      averageExecutionDuration: 0,
    };
    this.records = [];
    this.pendingExecutions.clear();
    this.totalDuration = 0;
  }

  private addRecord(record: ScheduleExecutionRecord): void {
    this.records.push(record);
    // 保持记录数量限制
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }
}
