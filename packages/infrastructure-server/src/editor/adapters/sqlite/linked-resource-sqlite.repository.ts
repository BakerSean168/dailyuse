/**
 * SQLite LinkedResource Repository Implementation
 * 閾炬帴璧勬簮鐨?SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { LinkedResource } from '@dailyuse/domain-server/editor';
import type { ILinkedResourceRepository, LinkedSourceType, LinkedTargetType } from '@dailyuse/domain-server/editor';

export class SqliteLinkedResourceRepository implements ILinkedResourceRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<LinkedResource | null> {
    const stmt = this.db.prepare(`SELECT * FROM linked_resources WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return LinkedResource.fromPersistenceDTO({
      uuid: row.uuid,
      source_document_uuid: row.source_document_uuid,
      target_document_uuid: row.target_document_uuid,
      source_type: row.source_type,
      target_type: row.target_type,
      is_valid: row.is_valid === 1,
      last_verified_at: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findBySourceDocumentUuid(sourceDocumentUuid: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_uuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(sourceDocumentUuid) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findByTargetDocumentUuid(targetDocumentUuid: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE target_document_uuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(targetDocumentUuid) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findBySourceType(
    sourceDocumentUuid: string,
    sourceType: LinkedSourceType,
  ): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_uuid = ? AND source_type = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(sourceDocumentUuid, sourceType) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findByTargetType(
    sourceDocumentUuid: string,
    targetType: LinkedTargetType,
  ): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_uuid = ? AND target_type = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(sourceDocumentUuid, targetType) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findInvalid(workspaceUuid: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT lr.* FROM linked_resources lr
       WHERE lr.is_valid = 0 AND lr.source_document_uuid IN (
         SELECT uuid FROM documents WHERE workspace_uuid = ?
       ) ORDER BY lr.createdAt DESC`
    );
    const rows = stmt.all(workspaceUuid) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async findNeedVerification(workspaceUuid: string, threshold: number): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT lr.* FROM linked_resources lr
       WHERE lr.last_verified_at IS NULL OR lr.last_verified_at < ?
       AND lr.source_document_uuid IN (
         SELECT uuid FROM documents WHERE workspace_uuid = ?
       ) ORDER BY lr.last_verified_at ASC`
    );
    const rows = stmt.all(Date.now() - threshold, workspaceUuid) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async save(resource: LinkedResource): Promise<void> {
    const dto = resource.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO linked_resources (
        uuid, source_document_uuid, target_document_uuid, source_type,
        target_type, is_valid, last_verified_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        is_valid = excluded.is_valid,
        last_verified_at = excluded.last_verified_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.source_document_uuid,
      dto.target_document_uuid,
      dto.source_type,
      dto.target_type,
      dto.is_valid ? 1 : 0,
      dto.last_verified_at ? dto.last_verified_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM linked_resources WHERE uuid = ?`);
    stmt.run(uuid);
  }

  private rowToResource(row: any): LinkedResource {
    return LinkedResource.fromPersistenceDTO({
      uuid: row.uuid,
      source_document_uuid: row.source_document_uuid,
      target_document_uuid: row.target_document_uuid,
      source_type: row.source_type,
      target_type: row.target_type,
      is_valid: row.is_valid === 1,
      last_verified_at: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

