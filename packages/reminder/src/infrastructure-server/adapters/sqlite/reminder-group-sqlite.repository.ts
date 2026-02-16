/**
 * SQLite ReminderGroup Repository Implementation
 * 鎻愰啋鍒嗙粍�?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { ReminderGroup } from '../../../domain-server/aggregates/reminder-group';
import type { IReminderGroupRepository } from '../../../domain-server/repositories/IReminderGroupRepository';

export class SqliteReminderGroupRepository implements IReminderGroupRepository {
  constructor(private db: Database.Database) {}

  async save(group: ReminderGroup): Promise<void> {
    const dto = group.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_groups (
        id, identity_id, name, control_mode, is_enabled, status, "order", stats, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        control_mode = excluded.control_mode,
        is_enabled = excluded.is_enabled,
        status = excluded.status,
        "order" = excluded."order",
        stats = excluded.stats,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.name,
      dto.controlMode,
      dto.enabled ? 1 : 0,
      dto.status,
      dto.order,
      dto.stats,
      dto.createdAt,
      dto.updatedAt,
      dto.deletedAt || null,
    );
  }

  async findById(id: string): Promise<ReminderGroup | null> {
    const stmt = this.db.prepare(`SELECT * FROM reminder_groups WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return ReminderGroup.fromPersistenceDTO({
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      controlMode: row.control_mode,
      enabled: row.is_enabled === 1,
      status: row.status,
      order: row.order,
      stats: row.stats,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || undefined,
    });
  }

  async findByAccountId(
    identityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    let sql = `SELECT * FROM reminder_groups WHERE identity_id = ?`;
    if (!options?.includeDeleted) {
      sql += ` AND deleted_at IS NULL`;
    }
    sql += ` ORDER BY "order" ASC`;
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      ReminderGroup.fromPersistenceDTO({
        id: row.id,
        identityId: row.identity_id,
        name: row.name,
        controlMode: row.control_mode,
        enabled: row.is_enabled === 1,
        status: row.status,
        order: row.order,
        stats: row.stats,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at || undefined,
      })
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_groups WHERE id = ?`);
    stmt.run(id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_groups WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  async findByControlMode(
    identityId: string,
    controlMode: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    let sql = `SELECT * FROM reminder_groups WHERE identity_id = ? AND control_mode = ?`;
    if (!options?.includeDeleted) {
      sql += ` AND deleted_at IS NULL`;
    }
    sql += ` ORDER BY "order" ASC`;
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(identityId, controlMode) as any[];

    return rows.map((row) => this.rowToGroup(row));
  }

  async findActive(identityId?: string): Promise<ReminderGroup[]> {
    let sql = `SELECT * FROM reminder_groups WHERE status = 'ACTIVE' AND deleted_at IS NULL`;
    const params: any[] = [];

    if (identityId) {
      sql += ` AND identity_id = ?`;
      params.push(identityId);
    }

    sql += ` ORDER BY "order" ASC`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToGroup(row));
  }

  async findByIds(ids: string[]): Promise<ReminderGroup[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_groups WHERE id IN (${placeholders})`
    );
    const rows = stmt.all(...ids) as any[];

    // 维持输入的顺序
    const idMap = new Map(rows.map((row) => [row.id, this.rowToGroup(row)]));
    return ids.map((id) => idMap.get(id)).filter((group) => group !== undefined) as ReminderGroup[];
  }

  async findByName(
    identityId: string,
    name: string,
    excludeId?: string,
  ): Promise<ReminderGroup | null> {
    let sql = `SELECT * FROM reminder_groups WHERE identity_id = ? AND name = ? AND deleted_at IS NULL`;
    const params: any[] = [identityId, name];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params) as any;

    if (!row) return null;
    return this.rowToGroup(row);
  }

  async count(
    identityId: string,
    options?: { status?: string; includeDeleted?: boolean },
  ): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM reminder_groups WHERE identity_id = ?`;
    const params: any[] = [identityId];

    if (options?.status) {
      sql += ` AND status = ?`;
      params.push(options.status);
    }

    if (!options?.includeDeleted) {
      sql += ` AND deleted_at IS NULL`;
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as any;
    return result?.count || 0;
  }

  private rowToGroup(row: any): ReminderGroup {
    return ReminderGroup.fromPersistenceDTO({
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      controlMode: row.control_mode,
      enabled: row.is_enabled === 1,
      status: row.status,
      order: row.order,
      stats: row.stats,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || undefined,
    });
  }
}

