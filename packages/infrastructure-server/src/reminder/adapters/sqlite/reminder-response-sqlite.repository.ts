/**
 * SQLite ReminderResponse Repository Implementation
 * 鎻愰啋鍝嶅簲鐨?SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { ReminderResponse } from '@dailyuse/domain-server/reminder';
import type { IReminderResponseRepository } from '@dailyuse/domain-server/reminder';

export class SqliteReminderResponseRepository implements IReminderResponseRepository {
  constructor(private db: Database.Database) {}

  async save(response: ReminderResponse): Promise<ReminderResponse> {
    const dto = response.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_responses (
        uuid, reminderTemplateUuid, action, responseTime, timestamp
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        action = excluded.action,
        responseTime = excluded.responseTime,
        timestamp = excluded.timestamp
    `);

    stmt.run(
      dto.uuid,
      dto.reminderTemplateUuid,
      dto.action,
      dto.responseTime || null,
      dto.timestamp,
    );

    return response;
  }

  async findById(uuid: string): Promise<ReminderResponse | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_responses WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ReminderResponse.fromPersistenceDTO({
      uuid: row.uuid,
      reminderTemplateUuid: row.reminderTemplateUuid,
      action: row.action,
      responseTime: row.responseTime || null,
      timestamp: row.timestamp,
    });
  }

  async findByTemplateUuid(templateUuid: string, limit?: number): Promise<ReminderResponse[]> {
    let query = `SELECT * FROM reminder_responses WHERE reminderTemplateUuid = ? ORDER BY timestamp DESC`;
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
        reminderTemplateUuid: row.reminderTemplateUuid,
        action: row.action,
        responseTime: row.responseTime || null,
        timestamp: row.timestamp,
      })
    );
  }
}


