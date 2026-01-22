/**
 * SQLite ReminderStatistics Repository Implementation
 * 提醒统计的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { ReminderStatistics } from '@dailyuse/domain-server/reminder';
import type { IReminderStatisticsRepository } from '@dailyuse/domain-server/reminder';

export class SqliteReminderStatisticsRepository implements IReminderStatisticsRepository {
  constructor(private db: Database.Database) {}

  async save(statistics: ReminderStatistics): Promise<void> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_statistics (
        uuid, account_uuid, total_sent, clicked_count, ignored_count,
        snoozed_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        total_sent = excluded.total_sent,
        clicked_count = excluded.clicked_count,
        ignored_count = excluded.ignored_count,
        snoozed_count = excluded.snoozed_count,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.total_sent,
      dto.clicked_count,
      dto.ignored_count,
      dto.snoozed_count,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_statistics WHERE account_uuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return ReminderStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      total_sent: row.total_sent,
      clicked_count: row.clicked_count,
      ignored_count: row.ignored_count,
      snoozed_count: row.snoozed_count,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findOrCreate(accountUuid: string): Promise<ReminderStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      const uuid = this.generateUuid();
      const now = new Date();

      const stmt = this.db.prepare(`
        INSERT INTO reminder_statistics (
          uuid, account_uuid, total_sent, clicked_count, ignored_count,
          snoozed_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(uuid, accountUuid, 0, 0, 0, 0, now.getTime(), now.getTime());

      stats = ReminderStatistics.fromPersistenceDTO({
        uuid,
        account_uuid: accountUuid,
        total_sent: 0,
        clicked_count: 0,
        ignored_count: 0,
        snoozed_count: 0,
        created_at: now,
        updated_at: now,
      });
    }

    return stats;
  }

  async delete(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_statistics WHERE account_uuid = ?`);
    stmt.run(accountUuid);
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
