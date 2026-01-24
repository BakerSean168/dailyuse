/**
 * SQLite ReminderGroup Repository Implementation
 * 鎻愰啋鍒嗙粍�?SQLite 浠撳偍瀹炵�?
 */

import type Database from 'better-sqlite3';
import { ReminderGroup } from '@dailyuse/domain-server/reminder';
import type { IReminderGroupRepository } from '@dailyuse/domain-server/reminder';

export class SqliteReminderGroupRepository implements IReminderGroupRepository {
  constructor(private db: Database.Database) {}

  async save(group: ReminderGroup): Promise<void> {
    const dto = group.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_groups (
        uuid, account_uuid, name, control_mode, is_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        control_mode = excluded.control_mode,
        is_enabled = excluded.is_enabled,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.controlMode,
      dto.enabled ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string): Promise<ReminderGroup | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_groups WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ReminderGroup.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      controlMode: row.control_mode,
      enabled: row.is_enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_groups WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      ReminderGroup.fromPersistenceDTO({
        uuid: row.uuid,
        accountUuid: row.account_uuid,
        name: row.name,
        controlMode: row.control_mode,
        enabled: row.is_enabled === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_groups WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_groups WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

