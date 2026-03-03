/**
 * SQLite Document Repository Implementation
 */

import type Database from 'better-sqlite3';
import { Document } from '../../../domain-server/entities/document';
import { DocumentMetadata } from '../../../domain-shared/value-objects/document-metadata';
import type { IDocumentRepository } from '../../../domain-server/repositories/IDocumentRepository';
import type { IndexStatus } from '@dailyuse/contracts/editor';
import { DocumentLanguage } from '@dailyuse/contracts/editor';

export class SqliteDocumentRepository implements IDocumentRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<Document | null> {
    const stmt = this.db.prepare(`SELECT * FROM documents WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDocument(row);
  }

  async findByWorkspaceId(workspaceId: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findByPath(workspaceId: string, path: string): Promise<Document | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? AND path = ? LIMIT 1`,
    );
    const row = stmt.get(workspaceId, path) as any;

    if (!row) return null;

    return this.rowToDocument(row);
  }

  async findByContentHash(contentHash: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE content_hash = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(contentHash) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findDocumentsNeedingIndex(workspaceId: string): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? AND index_status IN ('OUTDATED', 'FAILED') ORDER BY updated_at ASC`,
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findByIndexStatus(workspaceId: string, status: IndexStatus): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? AND index_status = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(workspaceId, status) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async findRecentlyModified(workspaceId: string, limit: number): Promise<Document[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM documents WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT ?`,
    );
    const rows = stmt.all(workspaceId, limit) as any[];

    return rows.map((row) => this.rowToDocument(row));
  }

  async save(document: Document): Promise<void> {
    const dto = document.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO documents (
        id, workspace_id, path, content_hash, file_size, index_status,
        last_indexed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content_hash = excluded.content_hash,
        file_size = excluded.file_size,
        index_status = excluded.index_status,
        last_indexed_at = excluded.last_indexed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.workspaceId,
      dto.path,
      dto.contentHash,
      null,
      dto.indexStatus,
      dto.lastIndexedAt ?? null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM documents WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(documents: Document[]): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO documents (
        id, workspace_id, path, content_hash, file_size, index_status,
        last_indexed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content_hash = excluded.content_hash,
        file_size = excluded.file_size,
        index_status = excluded.index_status,
        last_indexed_at = excluded.last_indexed_at,
        updated_at = excluded.updated_at
    `);
    const trx = this.db.transaction(() => {
      for (const document of documents) {
        const dto = document.toServerDTO();
        insert.run(
          dto.id,
          dto.workspaceId,
          dto.path,
          dto.contentHash,
          null,
          dto.indexStatus,
          dto.lastIndexedAt ?? null,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });
    trx();
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    this.db.prepare(`DELETE FROM documents WHERE workspace_id = ?`).run(workspaceId);
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    const row = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM documents WHERE workspace_id = ?`)
      .get(workspaceId) as { cnt: number };
    return row.cnt;
  }

  async countDocumentsNeedingIndex(workspaceId: string): Promise<number> {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as cnt FROM documents WHERE workspace_id = ? AND index_status IN ('OUTDATED', 'FAILED')`,
      )
      .get(workspaceId) as { cnt: number };
    return row.cnt;
  }

  private rowToDocument(row: any): Document {
    return Document.load({
      id: row.id,
      workspaceId: row.workspace_id,
      identityId: row.identityId ?? row.identity_id ?? row.workspace_id,
      path: row.path,
      name: row.name ?? row.path?.split('/').pop() ?? '',
      language: row.language ?? DocumentLanguage.Other,
      content: row.content ?? '',
      contentHash: row.content_hash,
      metadata: DocumentMetadata.createEmpty(),
      indexStatus: row.index_status as IndexStatus,
      lastIndexedAt: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
