/**
 * SQLite SearchEngine Repository Implementation
 */

import type Database from 'better-sqlite3';
import { SearchEngine } from '../../../domain-server/entities/search-engine';
import type { ISearchEngineRepository } from '../../../domain-server/repositories/ISearchEngineRepository';
import { SearchEngineSqliteMapper } from './mappers/search-engine-sqlite.mapper';

export class SqliteSearchEngineRepository implements ISearchEngineRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<SearchEngine | null> {
    const stmt = this.db.prepare(`SELECT * FROM search_engines WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return SearchEngineSqliteMapper.toDomain(row);
  }

  async findByWorkspaceId(workspaceId: string): Promise<SearchEngine | null> {
    const stmt = this.db.prepare(`SELECT * FROM search_engines WHERE workspace_id = ? LIMIT 1`);
    const row = stmt.get(workspaceId) as any;

    if (!row) return null;

    return SearchEngineSqliteMapper.toDomain(row);
  }

  async findIndexing(): Promise<SearchEngine[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM search_engines WHERE is_indexing = 1 ORDER BY updated_at ASC`,
    );
    const rows = stmt.all() as any[];

    return rows.map((row) => SearchEngineSqliteMapper.toDomain(row));
  }

  async findOutdated(threshold: number): Promise<SearchEngine[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM search_engines WHERE last_indexed_at < ? OR last_indexed_at IS NULL ORDER BY last_indexed_at ASC`,
    );
    const rows = stmt.all(Date.now() - threshold) as any[];

    return rows.map((row) => SearchEngineSqliteMapper.toDomain(row));
  }

  async save(engine: SearchEngine): Promise<void> {
    const dto = engine.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO search_engines (
        id, workspace_id, index_size, is_indexing, last_indexed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        index_size = excluded.index_size,
        is_indexing = excluded.is_indexing,
        last_indexed_at = excluded.last_indexed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.workspaceId,
      dto.indexedDocumentCount,
      dto.isIndexing ? 1 : 0,
      dto.lastIndexedAt ?? null,
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
    const stmt = this.db.prepare(`SELECT 1 FROM search_engines WHERE workspace_id = ? LIMIT 1`);
    return stmt.get(workspaceId) !== undefined;
  }

  async countIndexing(): Promise<number> {
    const row = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM search_engines WHERE is_indexing = 1`)
      .get() as { cnt: number };
    return row.cnt;
  }
}
