/**
 * SQLite ReminderResponse Repository Implementation
 * 鎻愰啋鍝嶅簲鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { ReminderResponse } from '@/domain-server';
import type { IReminderResponseRepository } from '@/domain-server';

export class SqliteReminderResponseRepository implements IReminderResponseRepository {
  constructor(private db: Database.Database) {}

  async save(response: ReminderResponse): Promise<ReminderResponse> {
    const dto = response.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_responses (
        uuid, reminder_template_uuid, action, response_time, timestamp
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        action = excluded.action,
        response_time = excluded.response_time,
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
      reminderTemplateUuid: row.reminder_template_uuid,
      action: row.action,
      responseTime: row.response_time || null,
      timestamp: row.timestamp,
    });
  }

  async findByTemplateUuid(templateUuid: string, limit?: number): Promise<ReminderResponse[]> {
    let query = `SELECT * FROM reminder_responses WHERE reminder_template_uuid = ? ORDER BY timestamp DESC`;
    const params: any[] = [templateUuid];

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToResponse(row));
  }

  async getResponseStats(
    templateUuid: string,
    lookbackDays: number = 30,
  ): Promise<{
    total: number;
    clicked: number;
    ignored: number;
    snoozed: number;
    dismissed: number;
    completed: number;
    avgResponseTime: number;
  }> {
    const cutoffTime = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN action = 'clicked' THEN 1 ELSE 0 END) as clicked,
        SUM(CASE WHEN action = 'ignored' THEN 1 ELSE 0 END) as ignored,
        SUM(CASE WHEN action = 'snoozed' THEN 1 ELSE 0 END) as snoozed,
        SUM(CASE WHEN action = 'dismissed' THEN 1 ELSE 0 END) as dismissed,
        SUM(CASE WHEN action = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(response_time) as avgResponseTime
      FROM reminder_responses
      WHERE reminder_template_uuid = ? AND timestamp >= ?
    `);

    const result = stmt.get(templateUuid, cutoffTime) as any;

    return {
      total: result?.total || 0,
      clicked: result?.clicked || 0,
      ignored: result?.ignored || 0,
      snoozed: result?.snoozed || 0,
      dismissed: result?.dismissed || 0,
      completed: result?.completed || 0,
      avgResponseTime: result?.avgResponseTime || 0,
    };
  }

  async deleteByTemplateUuid(templateUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM reminder_responses WHERE reminder_template_uuid = ?`);
    const result = stmt.run(templateUuid);
    return result.changes || 0;
  }

  async getResponseDistribution(
    templateUuid: string,
    lookbackDays: number = 30,
  ): Promise<Record<string, number>> {
    const cutoffTime = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

    const stmt = this.db.prepare(`
      SELECT action, COUNT(*) as count
      FROM reminder_responses
      WHERE reminder_template_uuid = ? AND timestamp >= ?
      GROUP BY action
    `);

    const rows = stmt.all(templateUuid, cutoffTime) as any[];
    const distribution: Record<string, number> = {
      clicked: 0,
      ignored: 0,
      snoozed: 0,
      dismissed: 0,
      completed: 0,
    };

    rows.forEach((row) => {
      if (distribution.hasOwnProperty(row.action)) {
        distribution[row.action] = row.count;
      }
    });

    return distribution;
  }

  private rowToResponse(row: any): ReminderResponse {
    return ReminderResponse.fromPersistenceDTO({
      uuid: row.uuid,
      reminderTemplateUuid: row.reminder_template_uuid,
      action: row.action,
      responseTime: row.response_time || null,
      timestamp: row.timestamp,
    });
  }
}


