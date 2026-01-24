/**
 * SQLite GoalStatistics Repository Implementation
 * 鐩爣缁熻鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { GoalStatistics } from '@dailyuse/domain-server/goal';
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';

export class SqliteGoalStatisticsRepository implements IGoalStatisticsRepository {
  constructor(private db: Database.Database) {}

  async findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_statistics WHERE accountUuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return GoalStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row\.accountUuid,
      total_count: row.total_count,
      active_count: row.active_count,
      completed_count: row.completed_count,
      createdAt: new Date(row\.createdAt),
      updatedAt: new Date(row\.updatedAt),
    });
  }

  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO goal_statistics (
        uuid, accountUuid, total_count, active_count, completed_count,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(accountUuid) DO UPDATE SET
        total_count = excluded.total_count,
        active_count = excluded.active_count,
        completed_count = excluded.completed_count,
        updatedAt = excluded\.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto\.accountUuid,
      dto.total_count,
      dto.active_count,
      dto.completed_count,
      dto\.createdAt,
      dto\.updatedAt,
    );

    return statistics;
  }

  async delete(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM goal_statistics WHERE accountUuid = ?`);
    const result = stmt.run(accountUuid);
    return (result.changes ?? 0) > 0;
  }

  async exists(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM goal_statistics WHERE accountUuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }
}


