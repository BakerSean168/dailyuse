/**
 * SQLite ReminderStatistics Repository Implementation
 * 鎻愰啋缁熻�?SQLite 浠撳偍瀹炵�?
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
        uuid, account_uuid, templateStats, groupStats, triggerStats, calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        templateStats = excluded.templateStats,
        groupStats = excluded.groupStats,
        triggerStats = excluded.triggerStats,
        calculated_at = excluded.calculated_at
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.templateStats,
      dto.groupStats,
      dto.triggerStats,
      dto.calculatedAt,
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
      accountUuid: row.account_uuid,
      templateStats: row.templateStats || '{}',
      groupStats: row.groupStats || '{}',
      triggerStats: row.triggerStats || '{}',
      calculatedAt: row.calculated_at,
    });
  }

  async findOrCreate(accountUuid: string): Promise<ReminderStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      const uuid = this.generateUuid();

      const stmt = this.db.prepare(`
        INSERT INTO reminder_statistics (
          uuid, account_uuid, templateStats, groupStats, triggerStats, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(uuid, accountUuid, '{}', '{}', '{}', Date.now());

      stats = ReminderStatistics.fromPersistenceDTO({
        uuid,
        accountUuid: accountUuid,
        templateStats: '{}',
        groupStats: '{}',
        triggerStats: '{}',
        calculatedAt: Date.now(),
      });
    }

    return stats;
  }

  async delete(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_statistics WHERE account_uuid = ?`);
    stmt.run(accountUuid);
  }

  async exists(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_statistics WHERE account_uuid = ? LIMIT 1`);
    return stmt.get(accountUuid) !== undefined;
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

