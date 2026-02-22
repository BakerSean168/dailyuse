/**
 * SQLite ReminderResponse Repository Implementation
 * 鎻愰啋鍝嶅簲鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { ReminderResponse } from '../../../domain-server/entities/reminder-response';
import { ReminderResponseId } from '../../../domain-shared/value-objects/reminder-response-id';
import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';
import type { IReminderResponseRepository } from '../../../domain-server/repositories/IReminderResponseRepository';

export class SqliteReminderResponseRepository implements IReminderResponseRepository {
  constructor(private db: Database.Database) {}

  async save(response: ReminderResponse): Promise<void> {
    const dto = response.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_responses (
        id, reminder_template_id, action, response_time, timestamp
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        action = excluded.action,
        response_time = excluded.response_time,
        timestamp = excluded.timestamp
    `);

    stmt.run(
      dto.id,
      dto.reminderTemplateId,
      dto.action,
      dto.responseTime || null,
      dto.timestamp,
    );

  }

  async findById(id: string): Promise<ReminderResponse | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_responses WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToResponse(row);
  }

  async findByTemplateId(templateId: string, limit?: number): Promise<ReminderResponse[]> {
    let query = `SELECT * FROM reminder_responses WHERE reminder_template_id = ? ORDER BY timestamp DESC`;
    const params: any[] = [templateId];

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToResponse(row));
  }

  async getResponseStats(
    templateId: string,
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
      WHERE reminder_template_id = ? AND timestamp >= ?
    `);

    const result = stmt.get(templateId, cutoffTime) as any;

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

  async deleteByTemplateId(templateId: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM reminder_responses WHERE reminder_template_id = ?`);
    const result = stmt.run(templateId);
    return result.changes || 0;
  }

  async getResponseDistribution(
    templateId: string,
    lookbackDays: number = 30,
  ): Promise<Record<string, number>> {
    const cutoffTime = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

    const stmt = this.db.prepare(`
      SELECT action, COUNT(*) as count
      FROM reminder_responses
      WHERE reminder_template_id = ? AND timestamp >= ?
      GROUP BY action
    `);

    const rows = stmt.all(templateId, cutoffTime) as any[];
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
    return ReminderResponse.load({
      id: ReminderResponseId.of(row.id),
      reminderTemplateId: row.reminder_template_id,
      action: row.action as ReminderResponseAction,
      responseTime: row.response_time ? new Date(row.response_time) : null,
      timestamp: new Date(row.timestamp),
    });
  }
}