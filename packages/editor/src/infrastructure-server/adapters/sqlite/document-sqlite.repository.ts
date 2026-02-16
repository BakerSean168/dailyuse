/**
 * SQLite Document Repository Implementation
 * 鏂囨。鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Document } from '../../../domain-server/entities/document';
import type { IDocumentRepository, IndexStatus } from '../../../domain-server/repositories/IDocumentRepository';

export class SqliteDocumentRepository implements IDocumentRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<Document | null> {
    const stmt = this.db.prepare(`SELECT * FROM documents WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return Document.fromPersistenceDTO({
      id: row.id,
      workspace_id: row.workspace_id,
      path: row.path,
      content_hash: row.content_hash,
      file_size: row.file_size,
      index_status: row.index_status as IndexStatus,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByWorkspaceId(workspaceId: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findByPath(workspaceId: string, path: string): Promise<Document | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? AND path = ? LIMIT 1`
    );
    const row = stmt.get(workspaceId, path) as any;

    if (!row) return null;

    return Document.fromPersistenceDTO({
      id: row.id,
      workspace_id: row.workspace_id,
      path: row.path,
      content_hash: row.content_hash,
      file_size: row.file_size,
      index_status: row.index_status as IndexStatus,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByContentHash(contentHash: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE content_hash = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(contentHash) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findDocumentsNeedingIndex(workspaceId: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? AND index_status IN ('OUTDATED', 'FAILED') ORDER BY updatedAt ASC`
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findByIndexStatus(workspaceId: string, status: IndexStatus): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? AND index_status = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(workspaceId, status) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findRecentlyModified(workspaceId: string, limit: number): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? ORDER BY updatedAt DESC LIMIT ?`
    );
    const rows = stmt.all(workspaceId, limit) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async save(document: Document): Promise<void> {
    const dto = document.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO documents (
        id, workspace_id, path, content_hash, file_size, index_status,
        last_indexed_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content_hash = excluded.content_hash,
        file_size = excluded.file_size,
        index_status = excluded.index_status,
        last_indexed_at = excluded.last_indexed_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.workspace_id,
      dto.path,
      dto.content_hash,
      dto.file_size,
      dto.index_status,
      dto.last_indexed_at ? dto.last_indexed_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM documents WHERE id = ?`);
    stmt.run(id);
  }

  private rowToDocument(row: any): Document {
    return Document.fromPersistenceDTO({
      id: row.id,
      workspace_id: row.workspace_id,
      path: row.path,
      content_hash: row.content_hash,
      file_size: row.file_size,
      index_status: row.index_status as IndexStatus,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

