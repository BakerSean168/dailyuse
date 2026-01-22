/**
 * SQLite ScheduleExecution Repository Implementation
 * 日程执行的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { ScheduleExecution } from '@dailyuse/domain-server/schedule';
import type { IScheduleExecutionRepository } from '@dailyuse/domain-server/schedule';

export class SqliteScheduleExecutionRepository implements IScheduleExecutionRepository {
  constructor(private db: Database.Database) {}

  async save(execution: ScheduleExecution): Promise<void> {
    const dto = execution.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_executions (
        uuid, task_uuid, executed_at, result, error_message,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        result = excluded.result,
        error_message = excluded.error_message,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.task_uuid,
      dto.executed_at,
      dto.result,
      dto.error_message || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<ScheduleExecution | null> {
    const stmt = this.db.prepare(`SELECT * FROM schedule_executions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ScheduleExecution.fromPersistenceDTO({
      uuid: row.uuid,
      task_uuid: row.task_uuid,
      executed_at: row.executed_at,
      result: row.result,
      error_message: row.error_message,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByTaskUuid(taskUuid: string): Promise<ScheduleExecution[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_executions WHERE task_uuid = ? ORDER BY executed_at DESC`
    );
    const rows = stmt.all(taskUuid) as any[];

    return rows.map((row) =>
      ScheduleExecution.fromPersistenceDTO({
        uuid: row.uuid,
        task_uuid: row.task_uuid,
        executed_at: row.executed_at,
        result: row.result,
        error_message: row.error_message,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }
}
