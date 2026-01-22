/**
 * SQLite NotificationPreference Repository Implementation
 * 通知偏好的 SQLite 仓储实现
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
        uuid, account_uuid, enable_all, enable_email, enable_push,
        quiet_hours_start, quiet_hours_end, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        enable_all = excluded.enable_all,
        enable_email = excluded.enable_email,
        enable_push = excluded.enable_push,
        quiet_hours_start = excluded.quiet_hours_start,
        quiet_hours_end = excluded.quiet_hours_end,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.enable_all ? 1 : 0,
      dto.enable_email ? 1 : 0,
      dto.enable_push ? 1 : 0,
      dto.quiet_hours_start || null,
      dto.quiet_hours_end || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string): Promise<NotificationPreference | null> {
    const stmt = this.db.prepare(`SELECT * FROM notification_preferences WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return NotificationPreference.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      enable_all: row.enable_all === 1,
      enable_email: row.enable_email === 1,
      enable_push: row.enable_push === 1,
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM notification_preferences WHERE account_uuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return NotificationPreference.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      enable_all: row.enable_all === 1,
      enable_email: row.enable_email === 1,
      enable_push: row.enable_push === 1,
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
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
      `SELECT 1 FROM notification_preferences WHERE account_uuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }
}
