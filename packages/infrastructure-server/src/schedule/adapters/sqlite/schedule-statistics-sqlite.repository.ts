/**
 * SQLite ScheduleStatistics Repository Implementation
 * 鏃ョ▼缁熻鐨?SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { ScheduleStatistics } from '@dailyuse/domain-server/schedule';
import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server/schedule';

export class SqliteScheduleStatisticsRepository implements IScheduleStatisticsRepository {
  constructor(private db: Database.Database) {}

  async save(statistics: ScheduleStatistics): Promise<void> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_statistics (
        uuid, accountUuid, total_tasks, completed_tasks, failed_tasks,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(accountUuid) DO UPDATE SET
        total_tasks = excluded.total_tasks,
        completed_tasks = excluded.completed_tasks,
        failed_tasks = excluded.failed_tasks,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.total_tasks,
      dto.completed_tasks,
      dto.failed_tasks,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_statistics WHERE accountUuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return ScheduleStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      total_tasks: row.total_tasks,
      completed_tasks: row.completed_tasks,
      failed_tasks: row.failed_tasks,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async getOrCreate(accountUuid: string): Promise<ScheduleStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      const uuid = this.generateUuid();
      const now = new Date();

      const stmt = this.db.prepare(`
        INSERT INTO schedule_statistics (
          uuid, accountUuid, total_tasks, completed_tasks, failed_tasks,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(uuid, accountUuid, 0, 0, 0, now.getTime(), now.getTime());

      stats = ScheduleStatistics.fromPersistenceDTO({
        uuid,
        account_uuid: accountUuid,
        total_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return stats;
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_statistics WHERE accountUuid = ?`);
    stmt.run(accountUuid);
  }

  async findAll(limit?: number, offset?: number): Promise<ScheduleStatistics[]> {
    let query = `SELECT * FROM schedule_statistics ORDER BY createdAt DESC`;
    const params: any[] = [];

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET ?`;
      params.push(offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      ScheduleStatistics.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        total_tasks: row.total_tasks,
        completed_tasks: row.completed_tasks,
        failed_tasks: row.failed_tasks,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO schedule_statistics (
        uuid, accountUuid, total_tasks, completed_tasks, failed_tasks,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(accountUuid) DO UPDATE SET
        total_tasks = excluded.total_tasks,
        completed_tasks = excluded.completed_tasks,
        failed_tasks = excluded.failed_tasks,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((stats: ScheduleStatistics[]) => {
      for (const stat of stats) {
        const dto = stat.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.accountUuid,
          dto.total_tasks,
          dto.completed_tasks,
          dto.failed_tasks,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(statistics);
  }

  async withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T> {
    return fn(this);
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

