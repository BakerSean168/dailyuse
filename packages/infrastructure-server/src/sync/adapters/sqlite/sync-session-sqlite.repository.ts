/**
 * SQLite SyncSession Repository Implementation
 * 鍚屾浼氳瘽鐨?SQLite 浠撳偍瀹炵幇
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
        uuid, accountUuid, status, startedAt, completedAt,
        error_message, sync_type, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completedAt = excluded.completedAt,
        error_message = excluded.error_message,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.status,
      dto.startedAt,
      dto.completedAt || null,
      dto.error_message || null,
      dto.sync_type,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<SyncSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM sync_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return SyncSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      status: row.status,
      started_at: new Date(row.startedAt),
      completed_at: row.completedAt ? new Date(row.completedAt) : null,
      error_message: row.error_message,
      sync_type: row.sync_type,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<SyncSession[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_sessions WHERE accountUuid = ? ORDER BY startedAt DESC LIMIT 50`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      SyncSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        status: row.status,
        started_at: new Date(row.startedAt),
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        error_message: row.error_message,
        sync_type: row.sync_type,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findActiveSession(accountUuid: string): Promise<SyncSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_sessions WHERE accountUuid = ? AND status IN ('PENDING', 'IN_PROGRESS') ORDER BY startedAt DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return SyncSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      status: row.status,
      started_at: new Date(row.startedAt),
      completed_at: row.completedAt ? new Date(row.completedAt) : null,
      error_message: row.error_message,
      sync_type: row.sync_type,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findLatestSession(accountUuid: string): Promise<SyncSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_sessions WHERE accountUuid = ? ORDER BY startedAt DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return SyncSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      status: row.status,
      started_at: new Date(row.startedAt),
      completed_at: row.completedAt ? new Date(row.completedAt) : null,
      error_message: row.error_message,
      sync_type: row.sync_type,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByQuery(accountUuid: string, options: SyncSessionQueryOptions): Promise<SyncSession[]> {
    let query = `SELECT * FROM sync_sessions WHERE accountUuid = ?`;
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
      query += ` AND startedAt > ?`;
      params.push(options.startedAfter);
    }

    if (options.completedBefore) {
      query += ` AND completedAt < ?`;
      params.push(options.completedBefore);
    }

    query += ` ORDER BY startedAt DESC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      SyncSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        status: row.status,
        started_at: new Date(row.startedAt),
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        error_message: row.error_message,
        sync_type: row.sync_type,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM sync_sessions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM sync_sessions WHERE accountUuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }
}

