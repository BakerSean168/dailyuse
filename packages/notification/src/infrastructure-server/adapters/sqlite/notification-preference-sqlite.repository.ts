/**
 * SQLite NotificationPreference Repository Implementation
 * 閫氱煡鍋忓ソ鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';
import type { INotificationPreferenceRepository } from '../../../domain-server/repositories/INotificationPreferenceRepository';

export class SqliteNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private db: Database.Database) {}

  async save(preference: NotificationPreference): Promise<void> {
    const dto = preference.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO notification_preferences (
        id, identityId, enable_all, enable_email, enable_push,
        quiet_hours_start, quiet_hours_end, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(identityId) DO UPDATE SET
        enable_all = excluded.enable_all,
        enable_email = excluded.enable_email,
        enable_push = excluded.enable_push,
        quiet_hours_start = excluded.quiet_hours_start,
        quiet_hours_end = excluded.quiet_hours_end,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.enable_all ? 1 : 0,
      dto.enable_email ? 1 : 0,
      dto.enable_push ? 1 : 0,
      dto.quiet_hours_start || null,
      dto.quiet_hours_end || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    const stmt = this.db.prepare(`SELECT * FROM notification_preferences WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return NotificationPreference.fromPersistenceDTO({
      id: row.id,
      identity_id: row.identityId,
      enable_all: row.enable_all === 1,
      enable_email: row.enable_email === 1,
      enable_push: row.enable_push === 1,
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountId(identityId: string): Promise<NotificationPreference | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM notification_preferences WHERE identityId = ? LIMIT 1`
    );
    const row = stmt.get(identityId) as any;

    if (!row) return null;

    return NotificationPreference.fromPersistenceDTO({
      id: row.id,
      identity_id: row.identityId,
      enable_all: row.enable_all === 1,
      enable_email: row.enable_email === 1,
      enable_push: row.enable_push === 1,
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM notification_preferences WHERE id = ?`);
    stmt.run(id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM notification_preferences WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  async existsByAccountId(identityId: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM notification_preferences WHERE identityId = ? LIMIT 1`
    );
    return stmt.get(identityId) !== undefined;
  }
}

