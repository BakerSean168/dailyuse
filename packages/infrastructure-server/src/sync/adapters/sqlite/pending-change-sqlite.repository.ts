/**
 * SQLite PendingChange Repository Implementation
 * 寰呭鐞嗗彉鏇寸殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { PendingChange } from '@dailyuse/domain-server/sync';
import type { ISyncPendingChangeRepository, PendingChangeQueryOptions } from '@dailyuse/domain-server/sync';

export class SqlitePendingChangeRepository implements ISyncPendingChangeRepository {
  constructor(private db: Database.Database) {}

  async save(change: PendingChange): Promise<void> {
    const dto = change.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO pending_changes (
        uuid, accountUuid, entity_type, entity_uuid, operation,
        old_data, new_data, status, sync_status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        sync_status = excluded.sync_status,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.entity_type,
      dto.entity_uuid,
      dto.operation,
      JSON.stringify(dto.old_data || {}),
      JSON.stringify(dto.new_data || {}),
      dto.status,
      dto.sync_status,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async saveMany(changes: PendingChange[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO pending_changes (
        uuid, accountUuid, entity_type, entity_uuid, operation,
        old_data, new_data, status, sync_status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        sync_status = excluded.sync_status,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: PendingChange[]) => {
      for (const change of items) {
        const dto = change.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.accountUuid,
          dto.entity_type,
          dto.entity_uuid,
          dto.operation,
          JSON.stringify(dto.old_data || {}),
          JSON.stringify(dto.new_data || {}),
          dto.status,
          dto.sync_status,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(changes);
  }

  async findByUuid(uuid: string): Promise<PendingChange | null> {
    const stmt = this.db.prepare(`SELECT * FROM pending_changes WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return PendingChange.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      entity_type: row.entity_type,
      entity_uuid: row.entity_uuid,
      operation: row.operation,
      old_data: JSON.parse(row.old_data),
      new_data: JSON.parse(row.new_data),
      status: row.status,
      sync_status: row.sync_status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<PendingChange[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM pending_changes WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      PendingChange.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        operation: row.operation,
        old_data: JSON.parse(row.old_data),
        new_data: JSON.parse(row.new_data),
        status: row.status,
        sync_status: row.sync_status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findUnsyncedChanges(accountUuid: string): Promise<PendingChange[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM pending_changes WHERE accountUuid = ? AND sync_status != 'SYNCED' ORDER BY createdAt ASC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      PendingChange.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        operation: row.operation,
        old_data: JSON.parse(row.old_data),
        new_data: JSON.parse(row.new_data),
        status: row.status,
        sync_status: row.sync_status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByQuery(accountUuid: string, options: PendingChangeQueryOptions): Promise<PendingChange[]> {
    let query = `SELECT * FROM pending_changes WHERE accountUuid = ?`;
    const params: any[] = [accountUuid];

    if (options.entityType) {
      query += ` AND entity_type = ?`;
      params.push(options.entityType);
    }

    if (options.entityUuid) {
      query += ` AND entity_uuid = ?`;
      params.push(options.entityUuid);
    }

    if (options.operation) {
      query += ` AND operation = ?`;
      params.push(options.operation);
    }

    if (options.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options.syncStatus) {
      query += ` AND sync_status = ?`;
      params.push(options.syncStatus);
    }

    query += ` ORDER BY createdAt ASC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      PendingChange.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        operation: row.operation,
        old_data: JSON.parse(row.old_data),
        new_data: JSON.parse(row.new_data),
        status: row.status,
        sync_status: row.sync_status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async count(accountUuid: string, options?: PendingChangeQueryOptions): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM pending_changes WHERE accountUuid = ?`;
    const params: any[] = [accountUuid];

    if (options?.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options?.syncStatus) {
      query += ` AND sync_status = ?`;
      params.push(options.syncStatus);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;

    return result.count;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM pending_changes WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM pending_changes WHERE accountUuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }

  async deleteOlderThan(accountUuid: string, timestamp: number): Promise<number> {
    const stmt = this.db.prepare(
      `DELETE FROM pending_changes WHERE accountUuid = ? AND createdAt < ?`
    );
    const result = stmt.run(accountUuid, timestamp);
    return result.changes ?? 0;
  }
}

