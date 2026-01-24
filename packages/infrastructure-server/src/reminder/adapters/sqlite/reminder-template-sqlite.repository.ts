/**
 * SQLite ReminderTemplate Repository Implementation
 * 鎻愰啋妯℃澘鐨?SQLite Repository瀹炵幇
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
        uuid, accountUuid, group_uuid, title, content, status,
        trigger_time, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        status = excluded.status,
        trigger_time = excluded.trigger_time,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.group_uuid,
      dto.title,
      dto.content,
      dto.status,
      dto.trigger_time,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string, options?: { includeHistory?: boolean }): Promise<ReminderTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_templates WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ReminderTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      group_uuid: row.group_uuid,
      title: row.title,
      content: row.content,
      status: row.status,
      trigger_time: row.trigger_time,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
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
      `SELECT * FROM reminder_templates WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      ReminderTemplate.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        group_uuid: row.group_uuid,
        title: row.title,
        content: row.content,
        status: row.status,
        trigger_time: row.trigger_time,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByGroupUuid(groupUuid: string): Promise<ReminderTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_templates WHERE group_uuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(groupUuid) as any[];

    return rows.map((row) =>
      ReminderTemplate.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        group_uuid: row.group_uuid,
        title: row.title,
        content: row.content,
        status: row.status,
        trigger_time: row.trigger_time,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_templates WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE reminder_templates SET status = 'DELETED', updatedAt = ? WHERE uuid = ?`
    );
    stmt.run(Date.now(), uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_templates WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

