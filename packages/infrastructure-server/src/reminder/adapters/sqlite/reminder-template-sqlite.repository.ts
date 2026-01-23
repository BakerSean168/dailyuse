/**
 * SQLite ReminderTemplate Repository Implementation
 * 提醒模板的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { ReminderTemplate } from '@dailyuse/domain-server/reminder';
import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';

export class SqliteReminderTemplateRepository implements IReminderTemplateRepository {
  constructor(private db: Database.Database) {}

  async save(template: ReminderTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_templates (
        uuid, account_uuid, group_uuid, title, content, status,
        trigger_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        status = excluded.status,
        trigger_time = excluded.trigger_time,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.group_uuid,
      dto.title,
      dto.content,
      dto.status,
      dto.trigger_time,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string, options?: { includeHistory?: boolean }): Promise<ReminderTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_templates WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ReminderTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      group_uuid: row.group_uuid,
      title: row.title,
      content: row.content,
      status: row.status,
      trigger_time: row.trigger_time,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeHistory?: boolean;
      includeDeleted?: boolean;
    },
  ): Promise<ReminderTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_templates WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      ReminderTemplate.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        group_uuid: row.group_uuid,
        title: row.title,
        content: row.content,
        status: row.status,
        trigger_time: row.trigger_time,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByGroupUuid(groupUuid: string): Promise<ReminderTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_templates WHERE group_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(groupUuid) as any[];

    return rows.map((row) =>
      ReminderTemplate.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        group_uuid: row.group_uuid,
        title: row.title,
        content: row.content,
        status: row.status,
        trigger_time: row.trigger_time,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_templates WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE reminder_templates SET status = 'DELETED', updated_at = ? WHERE uuid = ?`
    );
    stmt.run(Date.now(), uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_templates WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}
