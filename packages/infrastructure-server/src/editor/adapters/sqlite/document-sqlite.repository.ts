/**
 * SQLite Document Repository Implementation
 * 鏂囨。鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Document } from '@dailyuse/domain-server/editor';
import type { IDocumentRepository, IndexStatus } from '@dailyuse/domain-server/editor';

export class SqliteDocumentRepository implements IDocumentRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<Document | null> {
    const stmt = this.db.prepare(`SELECT * FROM documents WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Document.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
      path: row.path,
      content_hash: row.content_hash,
      file_size: row.file_size,
      index_status: row.index_status as IndexStatus,
      last_indexed_at: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByWorkspaceUuid(workspaceUuid: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_uuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(workspaceUuid) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findByPath(workspaceUuid: string, path: string): Promise<Document | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_uuid = ? AND path = ? LIMIT 1`
    );
    const row = stmt.get(workspaceUuid, path) as any;

    if (!row) return null;

    return Document.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
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

  async findDocumentsNeedingIndex(workspaceUuid: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_uuid = ? AND index_status IN ('OUTDATED', 'FAILED') ORDER BY updatedAt ASC`
    );
    const rows = stmt.all(workspaceUuid) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findByIndexStatus(workspaceUuid: string, status: IndexStatus): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_uuid = ? AND index_status = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(workspaceUuid, status) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findRecentlyModified(workspaceUuid: string, limit: number): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_uuid = ? ORDER BY updatedAt DESC LIMIT ?`
    );
    const rows = stmt.all(workspaceUuid, limit) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async save(document: Document): Promise<void> {
    const dto = document.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO documents (
        uuid, workspace_uuid, path, content_hash, file_size, index_status,
        last_indexed_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        content_hash = excluded.content_hash,
        file_size = excluded.file_size,
        index_status = excluded.index_status,
        last_indexed_at = excluded.last_indexed_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.workspace_uuid,
      dto.path,
      dto.content_hash,
      dto.file_size,
      dto.index_status,
      dto.last_indexed_at ? dto.last_indexed_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM documents WHERE uuid = ?`);
    stmt.run(uuid);
  }

  private rowToDocument(row: any): Document {
    return Document.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
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

