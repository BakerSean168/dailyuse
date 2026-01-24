/**
 * SQLite SearchEngine Repository Implementation
 * 鎼滅储寮曟搸鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { SearchEngine } from '@dailyuse/domain-server/editor';
import type { ISearchEngineRepository } from '@dailyuse/domain-server/editor';

export class SqliteSearchEngineRepository implements ISearchEngineRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<SearchEngine | null> {
    const stmt = this.db.prepare(`SELECT * FROM search_engines WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return SearchEngine.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
      index_size: row.index_size,
      is_indexing: row.is_indexing === 1,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByWorkspaceUuid(workspaceUuid: string): Promise<SearchEngine | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM search_engines WHERE workspace_uuid = ? LIMIT 1`
    );
    const row = stmt.get(workspaceUuid) as any;

    if (!row) return null;

    return SearchEngine.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
      index_size: row.index_size,
      is_indexing: row.is_indexing === 1,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findIndexing(): Promise<SearchEngine[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM search_engines WHERE is_indexing = 1 ORDER BY updatedAt ASC`
    );
    const rows = stmt.all() as any[];

    return rows.map((row) =>
      SearchEngine.fromPersistenceDTO({
        uuid: row.uuid,
        workspace_uuid: row.workspace_uuid,
        index_size: row.index_size,
        is_indexing: row.is_indexing === 1,
        last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findOutdated(threshold: number): Promise<SearchEngine[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM search_engines WHERE last_indexed_at < ? OR last_indexed_at IS NULL ORDER BY last_indexed_at ASC`
    );
    const rows = stmt.all(Date.now() - threshold) as any[];

    return rows.map((row) =>
      SearchEngine.fromPersistenceDTO({
        uuid: row.uuid,
        workspace_uuid: row.workspace_uuid,
        index_size: row.index_size,
        is_indexing: row.is_indexing === 1,
        last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async save(engine: SearchEngine): Promise<void> {
    const dto = engine.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO search_engines (
        uuid, workspace_uuid, index_size, is_indexing, last_indexed_at,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        index_size = excluded.index_size,
        is_indexing = excluded.is_indexing,
        last_indexed_at = excluded.last_indexed_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.workspace_uuid,
      dto.index_size,
      dto.is_indexing ? 1 : 0,
      dto.last_indexed_at ? dto.last_indexed_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM search_engines WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByWorkspaceUuid(workspaceUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM search_engines WHERE workspace_uuid = ?`);
    stmt.run(workspaceUuid);
  }

  async existsByWorkspaceUuid(workspaceUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM search_engines WHERE workspace_uuid = ? LIMIT 1`
    );
    return stmt.get(workspaceUuid) !== undefined;
  }
}

