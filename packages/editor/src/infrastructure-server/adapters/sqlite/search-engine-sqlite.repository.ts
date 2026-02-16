/**
 * SQLite SearchEngine Repository Implementation
 * 鎼滅储寮曟搸鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { SearchEngine } from '../../../domain-server/entities/search-engine';
import type { ISearchEngineRepository } from '../../../domain-server/repositories/ISearchEngineRepository';

export class SqliteSearchEngineRepository implements ISearchEngineRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<SearchEngine | null> {
    const stmt = this.db.prepare(`SELECT * FROM search_engines WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return SearchEngine.fromPersistenceDTO({
      id: row.id,
      workspace_id: row.workspace_id,
      index_size: row.index_size,
      is_indexing: row.is_indexing === 1,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByWorkspaceId(workspaceId: string): Promise<SearchEngine | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM search_engines WHERE workspace_id = ? LIMIT 1`
    );
    const row = stmt.get(workspaceId) as any;

    if (!row) return null;

    return SearchEngine.fromPersistenceDTO({
      id: row.id,
      workspace_id: row.workspace_id,
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
        id: row.id,
        workspace_id: row.workspace_id,
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
        id: row.id,
        workspace_id: row.workspace_id,
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
        id, workspace_id, index_size, is_indexing, last_indexed_at,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        index_size = excluded.index_size,
        is_indexing = excluded.is_indexing,
        last_indexed_at = excluded.last_indexed_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.workspace_id,
      dto.index_size,
      dto.is_indexing ? 1 : 0,
      dto.last_indexed_at ? dto.last_indexed_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM search_engines WHERE id = ?`);
    stmt.run(id);
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM search_engines WHERE workspace_id = ?`);
    stmt.run(workspaceId);
  }

  async existsByWorkspaceId(workspaceId: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM search_engines WHERE workspace_id = ? LIMIT 1`
    );
    return stmt.get(workspaceId) !== undefined;
  }
}

