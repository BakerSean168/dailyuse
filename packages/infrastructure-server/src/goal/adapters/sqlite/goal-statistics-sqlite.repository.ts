/**
 * SQLite GoalStatistics Repository Implementation
 * 目标统计的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { GoalStatistics } from '@dailyuse/domain-server/goal';
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';

export class SqliteGoalStatisticsRepository implements IGoalStatisticsRepository {
  constructor(private db: Database.Database) {}

  async findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_statistics WHERE account_uuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return GoalStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      total_count: row.total_count,
      active_count: row.active_count,
      completed_count: row.completed_count,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO goal_statistics (
        uuid, account_uuid, total_count, active_count, completed_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        total_count = excluded.total_count,
        active_count = excluded.active_count,
        completed_count = excluded.completed_count,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.total_count,
      dto.active_count,
      dto.completed_count,
      dto.created_at,
      dto.updated_at,
    );

    return statistics;
  }

  async delete(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM goal_statistics WHERE account_uuid = ?`);
    const result = stmt.run(accountUuid);
    return (result.changes ?? 0) > 0;
  }

  async exists(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM goal_statistics WHERE account_uuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }
}
