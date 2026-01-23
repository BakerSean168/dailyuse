/**
 * SQLite PendingChange Repository Implementation
 * 待处理变更的 SQLite 仓储实现
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
        uuid, account_uuid, entity_type, entity_uuid, operation,
        old_data, new_data, status, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        sync_status = excluded.sync_status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.entity_type,
      dto.entity_uuid,
      dto.operation,
      JSON.stringify(dto.old_data || {}),
      JSON.stringify(dto.new_data || {}),
      dto.status,
      dto.sync_status,
      dto.created_at,
      dto.updated_at,
    );
  }

  async saveMany(changes: PendingChange[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO pending_changes (
        uuid, account_uuid, entity_type, entity_uuid, operation,
        old_data, new_data, status, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        sync_status = excluded.sync_status,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: PendingChange[]) => {
      for (const change of items) {
        const dto = change.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.account_uuid,
          dto.entity_type,
          dto.entity_uuid,
          dto.operation,
          JSON.stringify(dto.old_data || {}),
          JSON.stringify(dto.new_data || {}),
          dto.status,
          dto.sync_status,
          dto.created_at,
          dto.updated_at,
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
      account_uuid: row.account_uuid,
      entity_type: row.entity_type,
      entity_uuid: row.entity_uuid,
      operation: row.operation,
      old_data: JSON.parse(row.old_data),
      new_data: JSON.parse(row.new_data),
      status: row.status,
      sync_status: row.sync_status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<PendingChange[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM pending_changes WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      PendingChange.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        operation: row.operation,
        old_data: JSON.parse(row.old_data),
        new_data: JSON.parse(row.new_data),
        status: row.status,
        sync_status: row.sync_status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findUnsyncedChanges(accountUuid: string): Promise<PendingChange[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM pending_changes WHERE account_uuid = ? AND sync_status != 'SYNCED' ORDER BY created_at ASC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      PendingChange.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        operation: row.operation,
        old_data: JSON.parse(row.old_data),
        new_data: JSON.parse(row.new_data),
        status: row.status,
        sync_status: row.sync_status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByQuery(accountUuid: string, options: PendingChangeQueryOptions): Promise<PendingChange[]> {
    let query = `SELECT * FROM pending_changes WHERE account_uuid = ?`;
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

    query += ` ORDER BY created_at ASC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      PendingChange.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        operation: row.operation,
        old_data: JSON.parse(row.old_data),
        new_data: JSON.parse(row.new_data),
        status: row.status,
        sync_status: row.sync_status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async count(accountUuid: string, options?: PendingChangeQueryOptions): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM pending_changes WHERE account_uuid = ?`;
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
    const stmt = this.db.prepare(`DELETE FROM pending_changes WHERE account_uuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }

  async deleteOlderThan(accountUuid: string, timestamp: number): Promise<number> {
    const stmt = this.db.prepare(
      `DELETE FROM pending_changes WHERE account_uuid = ? AND created_at < ?`
    );
    const result = stmt.run(accountUuid, timestamp);
    return result.changes ?? 0;
  }
}
