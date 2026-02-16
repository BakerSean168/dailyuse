/**
 * SQLite ReminderTemplate Repository Implementation
 * 提醒模板的 SQLite Repository 实现
 */

import type Database from 'better-sqlite3';
import { ReminderTemplate } from '../../../domain-server/aggregates/reminder-template';
import type { IReminderTemplateRepository } from '../../../domain-server/repositories/IReminderTemplateRepository';
import type { ReminderStatus, ReminderType, ImportanceLevel } from '@dailyuse/contracts/reminder';

export class SqliteReminderTemplateRepository implements IReminderTemplateRepository {
  constructor(private db: Database.Database) {}

  async save(template: ReminderTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_templates (
        id, identity_id, name, description, type, trigger, recurrence, 
        active_time, active_hours, notification_config, self_enabled, status,
        group_id, importance_level, tags, color, icon, next_trigger_at, stats,
        click_rate, ignore_rate, avg_response_time, snooze_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        trigger = excluded.trigger,
        recurrence = excluded.recurrence,
        active_time = excluded.active_time,
        active_hours = excluded.active_hours,
        notification_config = excluded.notification_config,
        self_enabled = excluded.self_enabled,
        status = excluded.status,
        importance_level = excluded.importance_level,
        tags = excluded.tags,
        color = excluded.color,
        icon = excluded.icon,
        next_trigger_at = excluded.next_trigger_at,
        stats = excluded.stats,
        click_rate = excluded.click_rate,
        ignore_rate = excluded.ignore_rate,
        avg_response_time = excluded.avg_response_time,
        snooze_count = excluded.snooze_count,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.name,
      dto.description || null,
      dto.type,
      dto.trigger,
      dto.recurrence || null,
      dto.activeTime,
      dto.activeHours || null,
      dto.notificationConfig,
      dto.selfEnabled ? 1 : 0,
      dto.status,
      dto.groupId || null,
      dto.importanceLevel,
      dto.tags,
      dto.color || null,
      dto.icon || null,
      dto.nextTriggerAt || null,
      dto.stats,
      dto.clickRate || null,
      dto.ignoreRate || null,
      dto.avgResponseTime || null,
      dto.snoozeCount || 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string, options?: { includeHistory?: boolean }): Promise<ReminderTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_templates WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;
    return this.rowToTemplate(row);
  }

  async findByAccountId(
    identityId: string,
    options?: {
      includeHistory?: boolean;
      includeDeleted?: boolean;
    },
  ): Promise<ReminderTemplate[]> {
    let sql = `SELECT * FROM reminder_templates WHERE identity_id = ?`;
    if (!options?.includeDeleted) {
      sql += ` AND status != 'DELETED'`;
    }
    sql += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByGroupId(groupId: string): Promise<ReminderTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_templates WHERE group_id = ? AND status != 'DELETED' ORDER BY created_at DESC`
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_templates WHERE id = ?`);
    stmt.run(id);
  }

  async softDelete(id: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE reminder_templates SET status = 'DELETED', updated_at = ? WHERE id = ?`
    );
    stmt.run(Date.now(), id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_templates WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  async findActive(identityId?: string): Promise<ReminderTemplate[]> {
    let sql = `SELECT * FROM reminder_templates WHERE status = 'ACTIVE'`;
    const params: any[] = [];

    if (identityId) {
      sql += ` AND identity_id = ?`;
      params.push(identityId);
    }

    sql += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByNextTriggerBefore(beforeTime: number, identityId?: string): Promise<ReminderTemplate[]> {
    let sql = `SELECT * FROM reminder_templates 
               WHERE status = 'ACTIVE' AND next_trigger_at IS NOT NULL AND next_trigger_at < ?`;
    const params: any[] = [beforeTime];

    if (identityId) {
      sql += ` AND identity_id = ?`;
      params.push(identityId);
    }

    sql += ` ORDER BY next_trigger_at ASC`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByIds(ids: string[]): Promise<ReminderTemplate[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_templates WHERE id IN (${placeholders})`
    );
    const rows = stmt.all(...ids) as any[];

    // 维持输入的顺序
    const idMap = new Map(rows.map((row) => [row.id, this.rowToTemplate(row)]));
    return ids.map((id) => idMap.get(id)).filter((t) => t !== undefined) as ReminderTemplate[];
  }

  async count(identityId: string, options?: { status?: ReminderStatus; includeDeleted?: boolean }): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM reminder_templates WHERE identity_id = ?`;
    const params: any[] = [identityId];

    if (options?.status) {
      sql += ` AND status = ?`;
      params.push(options.status);
    } else if (!options?.includeDeleted) {
      sql += ` AND status != 'DELETED'`;
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as any;
    return result?.count || 0;
  }

  private rowToTemplate(row: any): ReminderTemplate {
    return ReminderTemplate.fromPersistenceDTO({
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      description: row.description || undefined,
      type: row.type as ReminderType,
      trigger: row.trigger,
      recurrence: row.recurrence || undefined,
      activeTime: row.active_time,
      activeHours: row.active_hours || undefined,
      notificationConfig: row.notification_config,
      selfEnabled: row.self_enabled === 1,
      status: row.status as ReminderStatus,
      groupId: row.group_id || undefined,
      importanceLevel: row.importance_level as ImportanceLevel,
      tags: row.tags,
      color: row.color || undefined,
      icon: row.icon || undefined,
      nextTriggerAt: row.next_trigger_at || undefined,
      stats: row.stats,
      clickRate: row.click_rate || undefined,
      ignoreRate: row.ignore_rate || undefined,
      avgResponseTime: row.avg_response_time || undefined,
      snoozeCount: row.snooze_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

