/**
 * SQLite ScheduleStatistics Repository Implementation
 * 日程统计的 SQLite Repository 实现
 */

import type Database from 'better-sqlite3';
import { ScheduleStatistics } from '@/domain-server';
import type { IScheduleStatisticsRepository } from '@/domain-server';

export class SqliteScheduleStatisticsRepository implements IScheduleStatisticsRepository {
  constructor(private db: Database.Database) {}

  async save(statistics: ScheduleStatistics): Promise<void> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_statistics (
        account_uuid, total_tasks, active_tasks, paused_tasks, completed_tasks, cancelled_tasks, failed_tasks,
        total_executions, successful_executions, failed_executions, skipped_executions, timeout_executions,
        avg_execution_duration, min_execution_duration, max_execution_duration,
        module_statistics, last_updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        total_tasks = excluded.total_tasks,
        active_tasks = excluded.active_tasks,
        paused_tasks = excluded.paused_tasks,
        completed_tasks = excluded.completed_tasks,
        cancelled_tasks = excluded.cancelled_tasks,
        failed_tasks = excluded.failed_tasks,
        total_executions = excluded.total_executions,
        successful_executions = excluded.successful_executions,
        failed_executions = excluded.failed_executions,
        skipped_executions = excluded.skipped_executions,
        timeout_executions = excluded.timeout_executions,
        avg_execution_duration = excluded.avg_execution_duration,
        min_execution_duration = excluded.min_execution_duration,
        max_execution_duration = excluded.max_execution_duration,
        module_statistics = excluded.module_statistics,
        last_updated_at = excluded.last_updated_at
    `);

    stmt.run(
      dto.accountUuid,
      dto.totalTasks,
      dto.activeTasks,
      dto.pausedTasks,
      dto.completedTasks,
      dto.cancelledTasks,
      dto.failedTasks,
      dto.totalExecutions,
      dto.successfulExecutions,
      dto.failedExecutions,
      dto.skippedExecutions,
      dto.timeoutExecutions,
      dto.avgExecutionDuration,
      dto.minExecutionDuration,
      dto.maxExecutionDuration,
      dto.moduleStatistics,
      dto.lastUpdatedAt,
      dto.createdAt,
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_statistics WHERE account_uuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return ScheduleStatistics.fromPersistenceDTO(this.rowToStatistics(row));
  }

  async getOrCreate(accountUuid: string): Promise<ScheduleStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      // 创建一个新的默认统计对象
      stats = ScheduleStatistics.createEmpty(accountUuid);
      await this.save(stats);
    }

    return stats;
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_statistics WHERE account_uuid = ?`);
    stmt.run(accountUuid);
  }

  async findAll(limit?: number, offset?: number): Promise<ScheduleStatistics[]> {
    let sql = `SELECT * FROM schedule_statistics ORDER BY last_updated_at DESC`;
    const params: any[] = [];

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
      if (offset) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ScheduleStatistics.fromPersistenceDTO(this.rowToStatistics(row)));
  }

  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    const transaction = this.db.transaction(() => {
      for (const stat of statistics) {
        this.saveSync(stat);
      }
    });

    transaction();
  }

  async withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T> {
    const transaction = this.db.transaction(async () => {
      return await fn(this);
    });

    return transaction();
  }

  private saveSync(statistics: ScheduleStatistics): void {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_statistics (
        account_uuid, total_tasks, active_tasks, paused_tasks, completed_tasks, cancelled_tasks, failed_tasks,
        total_executions, successful_executions, failed_executions, skipped_executions, timeout_executions,
        avg_execution_duration, min_execution_duration, max_execution_duration,
        module_statistics, last_updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        total_tasks = excluded.total_tasks,
        active_tasks = excluded.active_tasks,
        paused_tasks = excluded.paused_tasks,
        completed_tasks = excluded.completed_tasks,
        cancelled_tasks = excluded.cancelled_tasks,
        failed_tasks = excluded.failed_tasks,
        total_executions = excluded.total_executions,
        successful_executions = excluded.successful_executions,
        failed_executions = excluded.failed_executions,
        skipped_executions = excluded.skipped_executions,
        timeout_executions = excluded.timeout_executions,
        avg_execution_duration = excluded.avg_execution_duration,
        min_execution_duration = excluded.min_execution_duration,
        max_execution_duration = excluded.max_execution_duration,
        module_statistics = excluded.module_statistics,
        last_updated_at = excluded.last_updated_at
    `);

    stmt.run(
      dto.accountUuid,
      dto.totalTasks,
      dto.activeTasks,
      dto.pausedTasks,
      dto.completedTasks,
      dto.cancelledTasks,
      dto.failedTasks,
      dto.totalExecutions,
      dto.successfulExecutions,
      dto.failedExecutions,
      dto.skippedExecutions,
      dto.timeoutExecutions,
      dto.avgExecutionDuration,
      dto.minExecutionDuration,
      dto.maxExecutionDuration,
      dto.moduleStatistics,
      dto.lastUpdatedAt,
      dto.createdAt,
    );
  }

  private rowToStatistics(row: any) {
    return {
      id: row.id,
      accountUuid: row.account_uuid,
      totalTasks: row.total_tasks,
      activeTasks: row.active_tasks,
      pausedTasks: row.paused_tasks,
      completedTasks: row.completed_tasks,
      cancelledTasks: row.cancelled_tasks,
      failedTasks: row.failed_tasks,
      totalExecutions: row.total_executions,
      successfulExecutions: row.successful_executions,
      failedExecutions: row.failed_executions,
      skippedExecutions: row.skipped_executions,
      timeoutExecutions: row.timeout_executions,
      avgExecutionDuration: row.avg_execution_duration,
      minExecutionDuration: row.min_execution_duration,
      maxExecutionDuration: row.max_execution_duration,
      moduleStatistics: row.module_statistics,
      lastUpdatedAt: row.last_updated_at,
      createdAt: row.created_at,
    };
  }
}

