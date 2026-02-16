/**
 * SQLite DocumentVersion Repository Implementation
 * 鏂囨。鐗堟湰鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { DocumentVersion } from '../../../domain-server/entities/document-version';
import type { IDocumentVersionRepository, VersionChangeType } from '../../../domain-server/repositories/IDocumentVersionRepository';

export class SqliteDocumentVersionRepository implements IDocumentVersionRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(`SELECT * FROM document_versions WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return DocumentVersion.fromPersistenceDTO({
      id: row.id,
      document_id: row.document_id,
      workspace_id: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      version_number: row.version_number,
      change_type: row.change_type as VersionChangeType,
      content_hash: row.content_hash ?? row.contentHash ?? '',
      content_diff: row.content_diff ?? null,
      change_description: row.change_description ?? null,
      previous_version_id: row.previous_version_id ?? null,
      created_by: row.created_by ?? null,
      createdAt: new Date(row.createdAt),
    });
  }

  async findByDocumentId(documentId: string): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC`
    );
    const rows = stmt.all(documentId) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async findLatestByDocumentId(documentId: string): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC LIMIT 1`
    );
    const row = stmt.get(documentId) as any;

    if (!row) return null;

    return this.rowToVersion(row);
  }

  async findByDocumentIdAndVersionNumber(
    documentId: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? AND version_number = ? LIMIT 1`
    );
    const row = stmt.get(documentId, versionNumber) as any;

    if (!row) return null;

    return this.rowToVersion(row);
  }

  async findByChangeType(documentId: string, changeType: VersionChangeType): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? AND change_type = ? ORDER BY version_number DESC`
    );
    const rows = stmt.all(documentId, changeType) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async findByTimeRange(
    documentId: string,
    startTime: number,
    endTime: number,
  ): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? AND createdAt >= ? AND createdAt <= ? ORDER BY version_number ASC`
    );
    const rows = stmt.all(documentId, startTime, endTime) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async save(version: DocumentVersion): Promise<void> {
    const dto = version.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO document_versions (
        id, document_id, version_number, change_type, content,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.document_id,
      dto.version_number,
      dto.change_type,
      dto.content_hash,
      dto.createdAt,
      dto.createdAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM document_versions WHERE id = ?`);
    stmt.run(id);
  }

  async deleteOlderThan(documentId: string, beforeTime: number): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM document_versions WHERE document_id = ? AND createdAt < ?`
    );
    stmt.run(documentId, beforeTime);
  }

  private rowToVersion(row: any): DocumentVersion {
    return DocumentVersion.fromPersistenceDTO({
      id: row.id,
      document_id: row.document_id,
      workspace_id: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      version_number: row.version_number,
      change_type: row.change_type as VersionChangeType,
      content_hash: row.content_hash ?? row.contentHash ?? '',
      content_diff: row.content_diff ?? null,
      change_description: row.change_description ?? null,
      previous_version_id: row.previous_version_id ?? null,
      created_by: row.created_by ?? null,
      createdAt: new Date(row.createdAt),
    });
  }

  async findById(id: string): Promise<DocumentVersion | null> {
    return this.findById(id);
  }

  async findByDocumentId(documentId: string): Promise<DocumentVersion[]> {
    return this.findByDocumentId(documentId);
  }

  async findLatestByDocumentId(documentId: string): Promise<DocumentVersion | null> {
    return this.findLatestByDocumentId(documentId);
  }

  async findByDocumentIdAndVersionNumber(
    documentId: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    return this.findByDocumentIdAndVersionNumber(documentId, versionNumber);
  }
}

