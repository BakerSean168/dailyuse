/**
 * SQLite ReminderGroup Repository Implementation
 * 提醒分组的 SQLite 仓储实现
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
      dto.account_uuid,
      dto.name,
      dto.control_mode,
      dto.is_enabled ? 1 : 0,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string): Promise<ReminderGroup | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_groups WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ReminderGroup.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      control_mode: row.control_mode,
      is_enabled: row.is_enabled === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
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
        account_uuid: row.account_uuid,
        name: row.name,
        control_mode: row.control_mode,
        is_enabled: row.is_enabled === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
