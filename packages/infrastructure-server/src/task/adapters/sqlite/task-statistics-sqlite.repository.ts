/**
 * SQLite TaskStatistics Repository Implementation
 * 浠诲姟缁熻鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { TaskStatistics } from '@dailyuse/domain-server/task';
import type { ITaskStatisticsRepository } from '@dailyuse/domain-server/task';

export class SqliteTaskStatisticsRepository implements ITaskStatisticsRepository {
  constructor(private db: Database.Database) {}

  async save(statistics: TaskStatistics): Promise<void> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_statistics (
        uuid, accountUuid, total_count, completed_count, overdue_count,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        total_count = excluded.total_count,
        completed_count = excluded.completed_count,
        overdue_count = excluded.overdue_count,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.total_count,
      dto.completed_count,
      dto.overdue_count,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<TaskStatistics | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_statistics WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return TaskStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      total_count: row.total_count,
      completed_count: row.completed_count,
      overdue_count: row.overdue_count,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<TaskStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_statistics WHERE accountUuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return TaskStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      total_count: row.total_count,
      completed_count: row.completed_count,
      overdue_count: row.overdue_count,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_statistics WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async saveBatch(statisticsList: TaskStatistics[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO task_statistics (
        uuid, accountUuid, total_count, completed_count, overdue_count,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        total_count = excluded.total_count,
        completed_count = excluded.completed_count,
        overdue_count = excluded.overdue_count,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((stats: TaskStatistics[]) => {
      for (const stat of stats) {
        const dto = stat.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.accountUuid,
          dto.total_count,
          dto.completed_count,
          dto.overdue_count,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(statisticsList);
  }
}

