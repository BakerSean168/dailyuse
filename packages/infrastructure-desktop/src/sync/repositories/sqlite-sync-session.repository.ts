/**
 * SQLite SyncSession Repository Implementation
 * 同步会话的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { SyncSession } from '@dailyuse/domain-server/sync';
import type { ISyncSessionRepository, SyncSessionQueryOptions } from '@dailyuse/domain-server/sync';

export class SqliteSyncSessionRepository implements ISyncSessionRepository {
  constructor(private db: Database.Database) {}

  async save(session: SyncSession): Promise<void> {
    const dto = session.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO sync_sessions (
        uuid, account_uuid, status, started_at, completed_at,
        error_message, sync_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        error_message = excluded.error_message,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.status,
      dto.started_at,
      dto.completed_at || null,
      dto.error_message || null,
      dto.sync_type,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<SyncSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM sync_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return SyncSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      status: row.status,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      error_message: row.error_message,
      sync_type: row.sync_type,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<SyncSession[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_sessions WHERE account_uuid = ? ORDER BY started_at DESC LIMIT 50`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      SyncSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        status: row.status,
        started_at: new Date(row.started_at),
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        error_message: row.error_message,
        sync_type: row.sync_type,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findActiveSession(accountUuid: string): Promise<SyncSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_sessions WHERE account_uuid = ? AND status IN ('PENDING', 'IN_PROGRESS') ORDER BY started_at DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return SyncSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      status: row.status,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      error_message: row.error_message,
      sync_type: row.sync_type,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findLatestSession(accountUuid: string): Promise<SyncSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_sessions WHERE account_uuid = ? ORDER BY started_at DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return SyncSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      status: row.status,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      error_message: row.error_message,
      sync_type: row.sync_type,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByQuery(accountUuid: string, options: SyncSessionQueryOptions): Promise<SyncSession[]> {
    let query = `SELECT * FROM sync_sessions WHERE account_uuid = ?`;
    const params: any[] = [accountUuid];

    if (options.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options.syncType) {
      query += ` AND sync_type = ?`;
      params.push(options.syncType);
    }

    if (options.startedAfter) {
      query += ` AND started_at > ?`;
      params.push(options.startedAfter);
    }

    if (options.completedBefore) {
      query += ` AND completed_at < ?`;
      params.push(options.completedBefore);
    }

    query += ` ORDER BY started_at DESC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      SyncSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        status: row.status,
        started_at: new Date(row.started_at),
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        error_message: row.error_message,
        sync_type: row.sync_type,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM sync_sessions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM sync_sessions WHERE account_uuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }
}
