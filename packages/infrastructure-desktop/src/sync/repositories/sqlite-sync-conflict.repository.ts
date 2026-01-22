/**
 * SQLite SyncConflict Repository Implementation
 * 同步冲突的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { SyncConflict } from '@dailyuse/domain-server/sync';
import type { ISyncConflictRepository, SyncConflictQueryOptions } from '@dailyuse/domain-server/sync';

export class SqliteSyncConflictRepository implements ISyncConflictRepository {
  constructor(private db: Database.Database) {}

  async save(conflict: SyncConflict): Promise<void> {
    const dto = conflict.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO sync_conflicts (
        uuid, session_id, entity_type, entity_uuid, conflict_type,
        status, auto_resolvable, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.session_id,
      dto.entity_type,
      dto.entity_uuid,
      dto.conflict_type,
      dto.status,
      dto.auto_resolvable ? 1 : 0,
      dto.created_at,
      dto.updated_at,
    );
  }

  async saveMany(conflicts: SyncConflict[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO sync_conflicts (
        uuid, session_id, entity_type, entity_uuid, conflict_type,
        status, auto_resolvable, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: SyncConflict[]) => {
      for (const conflict of items) {
        const dto = conflict.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.session_id,
          dto.entity_type,
          dto.entity_uuid,
          dto.conflict_type,
          dto.status,
          dto.auto_resolvable ? 1 : 0,
          dto.created_at,
          dto.updated_at,
        );
      }
    });

    transaction(conflicts);
  }

  async findByUuid(uuid: string): Promise<SyncConflict | null> {
    const stmt = this.db.prepare(`SELECT * FROM sync_conflicts WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return SyncConflict.fromPersistenceDTO({
      uuid: row.uuid,
      session_id: row.session_id,
      entity_type: row.entity_type,
      entity_uuid: row.entity_uuid,
      conflict_type: row.conflict_type,
      status: row.status,
      auto_resolvable: row.auto_resolvable === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findBySessionId(accountUuid: string, sessionId: string): Promise<SyncConflict[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_conflicts WHERE session_id = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(sessionId) as any[];

    return rows.map((row) =>
      SyncConflict.fromPersistenceDTO({
        uuid: row.uuid,
        session_id: row.session_id,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        conflict_type: row.conflict_type,
        status: row.status,
        auto_resolvable: row.auto_resolvable === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findUnresolved(accountUuid: string, sessionId?: string): Promise<SyncConflict[]> {
    let query = `SELECT * FROM sync_conflicts WHERE status != 'RESOLVED'`;
    const params: any[] = [];

    if (sessionId) {
      query += ` AND session_id = ?`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      SyncConflict.fromPersistenceDTO({
        uuid: row.uuid,
        session_id: row.session_id,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        conflict_type: row.conflict_type,
        status: row.status,
        auto_resolvable: row.auto_resolvable === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findAutoResolvable(accountUuid: string, sessionId: string): Promise<SyncConflict[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_conflicts WHERE session_id = ? AND auto_resolvable = 1 AND status != 'RESOLVED' ORDER BY created_at DESC`
    );
    const rows = stmt.all(sessionId) as any[];

    return rows.map((row) =>
      SyncConflict.fromPersistenceDTO({
        uuid: row.uuid,
        session_id: row.session_id,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        conflict_type: row.conflict_type,
        status: row.status,
        auto_resolvable: row.auto_resolvable === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByQuery(accountUuid: string, options: SyncConflictQueryOptions): Promise<SyncConflict[]> {
    let query = `SELECT * FROM sync_conflicts WHERE 1=1`;
    const params: any[] = [];

    if (options.sessionId) {
      query += ` AND session_id = ?`;
      params.push(options.sessionId);
    }

    if (options.entityType) {
      query += ` AND entity_type = ?`;
      params.push(options.entityType);
    }

    if (options.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options.conflictType) {
      query += ` AND conflict_type = ?`;
      params.push(options.conflictType);
    }

    if (options.autoResolvable !== undefined) {
      query += ` AND auto_resolvable = ?`;
      params.push(options.autoResolvable ? 1 : 0);
    }

    query += ` ORDER BY created_at DESC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      SyncConflict.fromPersistenceDTO({
        uuid: row.uuid,
        session_id: row.session_id,
        entity_type: row.entity_type,
        entity_uuid: row.entity_uuid,
        conflict_type: row.conflict_type,
        status: row.status,
        auto_resolvable: row.auto_resolvable === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async count(accountUuid: string, options?: SyncConflictQueryOptions): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM sync_conflicts WHERE 1=1`;
    const params: any[] = [];

    if (options?.sessionId) {
      query += ` AND session_id = ?`;
      params.push(options.sessionId);
    }

    if (options?.entityType) {
      query += ` AND entity_type = ?`;
      params.push(options.entityType);
    }

    if (options?.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;

    return result.count;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM sync_conflicts WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteBySessionId(accountUuid: string, sessionId: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM sync_conflicts WHERE session_id = ?`);
    const result = stmt.run(sessionId);
    return result.changes ?? 0;
  }
}
