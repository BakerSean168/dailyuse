/**
 * SQLite ScheduleExecution Repository Implementation
 * 日程执行的 SQLite Repository 实现
 */

import type Database from 'better-sqlite3';
import { ScheduleExecution } from '../../../domain-server/entities/schedule-execution';
import type { IScheduleExecutionRepository } from '../../../domain-server/repositories/IScheduleExecutionRepository';
import type { ExecutionStatus } from '@dailyuse/contracts/schedule';

export class SqliteScheduleExecutionRepository implements IScheduleExecutionRepository {
  constructor(private db: Database.Database) {}

  async save(execution: ScheduleExecution): Promise<void> {
    const dto = execution.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_executions (
        uuid, task_uuid, execution_time, status, duration, result, error, retry_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        duration = excluded.duration,
        result = excluded.result,
        error = excluded.error,
        retry_count = excluded.retry_count
    `);

    stmt.run(
      dto.uuid,
      dto.taskUuid,
      dto.executionTime,
      dto.status,
      dto.duration || null,
      dto.result || null,
      dto.error || null,
      dto.retryCount,
      dto.createdAt,
    );
  }

  async findByUuid(uuid: string): Promise<ScheduleExecution | null> {
    const stmt = this.db.prepare(`SELECT * FROM schedule_executions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ScheduleExecution.fromPersistenceDTO(this.rowToExecution(row));
  }

  async findByTaskUuid(taskUuid: string): Promise<ScheduleExecution[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_executions WHERE task_uuid = ? ORDER BY execution_time DESC`
    );
    const rows = stmt.all(taskUuid) as any[];

    return rows.map((row) => ScheduleExecution.fromPersistenceDTO(this.rowToExecution(row)));
  }

  async findByStatus(status: ExecutionStatus): Promise<ScheduleExecution[]> {
    const stmt = this.db.prepare(`SELECT * FROM schedule_executions WHERE status = ?`);
    const rows = stmt.all(status) as any[];

    return rows.map((row) => ScheduleExecution.fromPersistenceDTO(this.rowToExecution(row)));
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_executions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByTaskUuid(taskUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_executions WHERE task_uuid = ?`);
    stmt.run(taskUuid);
  }

  private rowToExecution(row: any) {
    return {
      uuid: row.uuid,
      taskUuid: row.task_uuid,
      executionTime: row.execution_time,
      status: row.status as ExecutionStatus,
      duration: row.duration || null,
      result: row.result || null,
      error: row.error || null,
      retryCount: row.retry_count,
      createdAt: row.created_at,
    };
  }
}

