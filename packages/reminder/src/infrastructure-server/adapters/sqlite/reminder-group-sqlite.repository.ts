/**
 * SQLite ReminderGroup Repository Implementation
 * 鎻愰啋鍒嗙粍�?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { ReminderGroup } from '@/domain-server';
import type { IReminderGroupRepository } from '@/domain-server';

export class SqliteReminderGroupRepository implements IReminderGroupRepository {
  constructor(private db: Database.Database) {}

  async save(group: ReminderGroup): Promise<void> {
    const dto = group.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO reminder_groups (
        uuid, account_uuid, name, control_mode, is_enabled, status, "order", stats, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
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
      dto.uuid,
      dto.accountUuid,
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
      status: row.status,
      order: row.order,
      stats: row.stats,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || undefined,
    });
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    let sql = `SELECT * FROM reminder_groups WHERE account_uuid = ?`;
    if (!options?.includeDeleted) {
      sql += ` AND deleted_at IS NULL`;
    }
    sql += ` ORDER BY "order" ASC`;
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      ReminderGroup.fromPersistenceDTO({
        uuid: row.uuid,
        accountUuid: row.account_uuid,
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

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM reminder_groups WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM reminder_groups WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }

  async findByControlMode(
    accountUuid: string,
    controlMode: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    let sql = `SELECT * FROM reminder_groups WHERE account_uuid = ? AND control_mode = ?`;
    if (!options?.includeDeleted) {
      sql += ` AND deleted_at IS NULL`;
    }
    sql += ` ORDER BY "order" ASC`;
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(accountUuid, controlMode) as any[];

    return rows.map((row) => this.rowToGroup(row));
  }

  async findActive(accountUuid?: string): Promise<ReminderGroup[]> {
    let sql = `SELECT * FROM reminder_groups WHERE status = 'ACTIVE' AND deleted_at IS NULL`;
    const params: any[] = [];

    if (accountUuid) {
      sql += ` AND account_uuid = ?`;
      params.push(accountUuid);
    }

    sql += ` ORDER BY "order" ASC`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToGroup(row));
  }

  async findByIds(uuids: string[]): Promise<ReminderGroup[]> {
    if (uuids.length === 0) return [];

    const placeholders = uuids.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM reminder_groups WHERE uuid IN (${placeholders})`
    );
    const rows = stmt.all(...uuids) as any[];

    // 维持输入的顺序
    const uuidMap = new Map(rows.map((row) => [row.uuid, this.rowToGroup(row)]));
    return uuids.map((uuid) => uuidMap.get(uuid)).filter((group) => group !== undefined) as ReminderGroup[];
  }

  async findByName(
    accountUuid: string,
    name: string,
    excludeUuid?: string,
  ): Promise<ReminderGroup | null> {
    let sql = `SELECT * FROM reminder_groups WHERE account_uuid = ? AND name = ? AND deleted_at IS NULL`;
    const params: any[] = [accountUuid, name];

    if (excludeUuid) {
      sql += ` AND uuid != ?`;
      params.push(excludeUuid);
    }

    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params) as any;

    if (!row) return null;
    return this.rowToGroup(row);
  }

  async count(
    accountUuid: string,
    options?: { status?: string; includeDeleted?: boolean },
  ): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM reminder_groups WHERE account_uuid = ?`;
    const params: any[] = [accountUuid];

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
      uuid: row.uuid,
      accountUuid: row.account_uuid,
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

