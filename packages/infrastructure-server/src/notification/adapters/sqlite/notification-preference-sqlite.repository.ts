/**
 * SQLite NotificationPreference Repository Implementation
 * 閫氱煡鍋忓ソ鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { NotificationPreference } from '@dailyuse/domain-server/notification';
import type { INotificationPreferenceRepository } from '@dailyuse/domain-server/notification';

export class SqliteNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private db: Database.Database) {}

  async save(preference: NotificationPreference): Promise<void> {
    const dto = preference.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO notification_preferences (
        uuid, accountUuid, enable_all, enable_email, enable_push,
        quiet_hours_start, quiet_hours_end, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(accountUuid) DO UPDATE SET
        enable_all = excluded.enable_all,
        enable_email = excluded.enable_email,
        enable_push = excluded.enable_push,
        quiet_hours_start = excluded.quiet_hours_start,
        quiet_hours_end = excluded.quiet_hours_end,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.enable_all ? 1 : 0,
      dto.enable_email ? 1 : 0,
      dto.enable_push ? 1 : 0,
      dto.quiet_hours_start || null,
      dto.quiet_hours_end || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string): Promise<NotificationPreference | null> {
    const stmt = this.db.prepare(`SELECT * FROM notification_preferences WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return NotificationPreference.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      enable_all: row.enable_all === 1,
      enable_email: row.enable_email === 1,
      enable_push: row.enable_push === 1,
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM notification_preferences WHERE accountUuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return NotificationPreference.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      enable_all: row.enable_all === 1,
      enable_email: row.enable_email === 1,
      enable_push: row.enable_push === 1,
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM notification_preferences WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM notification_preferences WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM notification_preferences WHERE accountUuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }
}

