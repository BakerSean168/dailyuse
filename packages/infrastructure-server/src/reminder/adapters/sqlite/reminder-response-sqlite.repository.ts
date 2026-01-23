/**
 * SQLite ReminderResponse Repository Implementation
 * 提醒响应的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { ReminderResponse } from '@dailyuse/domain-server/reminder';
import type { IReminderResponseRepository, ResponseAction } from '@dailyuse/domain-server/reminder';

export class SqliteReminderResponseRepository implements IReminderResponseRepository {
  constructor(private db: Database.Database) {}

  async save(response: ReminderResponse): Promise<ReminderResponse> {
    const dto = response.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_responses (
        uuid, template_uuid, action, responded_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        action = excluded.action,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.template_uuid,
      dto.action,
      dto.responded_at,
      dto.created_at,
      dto.updated_at,
    );

    return response;
  }

  async findById(uuid: string): Promise<ReminderResponse | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_responses WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ReminderResponse.fromPersistenceDTO({
      uuid: row.uuid,
      template_uuid: row.template_uuid,
      action: row.action as ResponseAction,
      responded_at: new Date(row.responded_at),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByTemplateUuid(templateUuid: string, limit?: number): Promise<ReminderResponse[]> {
    let query = `SELECT * FROM reminder_responses WHERE template_uuid = ? ORDER BY responded_at DESC`;
    const params: any[] = [templateUuid];

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      ReminderResponse.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        action: row.action as ResponseAction,
        responded_at: new Date(row.responded_at),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }
}
