/**
 * SQLite LinkedResource Repository Implementation
 * 閾炬帴Resource鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { LinkedResource } from '../../../domain-server/entities/linked-resource';
import type { ILinkedResourceRepository, LinkedSourceType, LinkedTargetType } from '../../../domain-server/repositories/ILinkedResourceRepository';

export class SqliteLinkedResourceRepository implements ILinkedResourceRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<LinkedResource | null> {
    const stmt = this.db.prepare(`SELECT * FROM linked_resources WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return LinkedResource.fromPersistenceDTO({
      id: row.id,
      source_document_id: row.source_document_id,
      target_document_id: row.target_document_id,
      source_type: row.source_type,
      target_type: row.target_type,
      is_valid: row.is_valid === 1,
      last_verified_at: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findBySourceDocumentId(sourceDocumentId: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_id = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(sourceDocumentId) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findByTargetDocumentId(targetDocumentId: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE target_document_id = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(targetDocumentId) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findBySourceType(
    sourceDocumentId: string,
    sourceType: LinkedSourceType,
  ): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_id = ? AND source_type = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(sourceDocumentId, sourceType) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findByTargetType(
    sourceDocumentId: string,
    targetType: LinkedTargetType,
  ): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_id = ? AND target_type = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(sourceDocumentId, targetType) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findInvalid(workspaceId: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT lr.* FROM linked_resources lr
       WHERE lr.is_valid = 0 AND lr.source_document_id IN (
         SELECT id FROM documents WHERE workspace_id = ?
       ) ORDER BY lr.createdAt DESC`
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findNeedVerification(workspaceId: string, threshold: number): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT lr.* FROM linked_resources lr
       WHERE lr.last_verified_at IS NULL OR lr.last_verified_at < ?
       AND lr.source_document_id IN (
         SELECT id FROM documents WHERE workspace_id = ?
       ) ORDER BY lr.last_verified_at ASC`
    );
    const rows = stmt.all(Date.now() - threshold, workspaceId) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async save(resource: LinkedResource): Promise<void> {
    const dto = resource.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO linked_resources (
        id, source_document_id, target_document_id, source_type,
        target_type, is_valid, last_verified_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_valid = excluded.is_valid,
        last_verified_at = excluded.last_verified_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.source_document_id,
      dto.target_document_id,
      dto.source_type,
      dto.target_type,
      dto.is_valid ? 1 : 0,
      dto.last_verified_at ? dto.last_verified_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM linked_resources WHERE id = ?`);
    stmt.run(id);
  }

  private rowToResource(row: any): LinkedResource {
    return LinkedResource.fromPersistenceDTO({
      id: row.id,
      source_document_id: row.source_document_id,
      target_document_id: row.target_document_id,
      source_type: row.source_type,
      target_type: row.target_type,
      is_valid: row.is_valid === 1,
      last_verified_at: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

