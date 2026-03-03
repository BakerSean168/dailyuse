/**
 * SQLite DocumentVersion Repository Implementation
 */

import type Database from 'better-sqlite3';
import { DocumentVersion } from '../../../domain-server/entities/document-version';
import type { IDocumentVersionRepository } from '../../../domain-server/repositories/IDocumentVersionRepository';
import type { VersionChangeType } from '@dailyuse/contracts/editor';

export class SqliteDocumentVersionRepository implements IDocumentVersionRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(`SELECT * FROM document_versions WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToVersion(row);
  }

  async findByDocumentId(documentId: string): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC`,
    );
    const rows = stmt.all(documentId) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async findLatestByDocumentId(documentId: string): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC LIMIT 1`,
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
      `SELECT * FROM document_versions WHERE document_id = ? AND version_number = ? LIMIT 1`,
    );
    const row = stmt.get(documentId, versionNumber) as any;

    if (!row) return null;

    return this.rowToVersion(row);
  }

  async findByChangeType(
    documentId: string,
    changeType: VersionChangeType,
  ): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_id = ? AND change_type = ? ORDER BY version_number DESC`,
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
      `SELECT * FROM document_versions WHERE document_id = ? AND created_at >= ? AND created_at <= ? ORDER BY version_number ASC`,
    );
    const rows = stmt.all(documentId, startTime, endTime) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async save(version: DocumentVersion): Promise<void> {
    const dto = version.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO document_versions (
        id, document_id, version_number, change_type, content,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.documentId,
      dto.versionNumber,
      dto.changeType,
      dto.contentHash,
      dto.createdAt,
      dto.createdAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM document_versions WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(versions: DocumentVersion[]): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO document_versions (
        id, document_id, version_number, change_type, content,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        updated_at = excluded.updated_at
    `);
    const trx = this.db.transaction(() => {
      for (const version of versions) {
        const dto = version.toServerDTO();
        insert.run(
          dto.id,
          dto.documentId,
          dto.versionNumber,
          dto.changeType,
          dto.contentHash,
          dto.createdAt,
          dto.createdAt,
        );
      }
    });
    trx();
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    this.db.prepare(`DELETE FROM document_versions WHERE document_id = ?`).run(documentId);
  }

  async countByDocumentId(documentId: string): Promise<number> {
    const row = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM document_versions WHERE document_id = ?`)
      .get(documentId) as { cnt: number };
    return row.cnt;
  }

  async getLatestVersionNumber(documentId: string): Promise<number> {
    const row = this.db
      .prepare(
        `SELECT COALESCE(MAX(version_number), 0) as max_ver FROM document_versions WHERE document_id = ?`,
      )
      .get(documentId) as { max_ver: number };
    return row.max_ver;
  }

  async deleteOlderThan(documentId: string, beforeTime: number): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM document_versions WHERE document_id = ? AND created_at < ?`,
    );
    stmt.run(documentId, beforeTime);
  }

  private rowToVersion(row: any): DocumentVersion {
    return DocumentVersion.load({
      id: row.id,
      documentId: row.document_id,
      workspaceId: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      versionNumber: row.version_number,
      changeType: row.change_type as VersionChangeType,
      contentHash: row.content_hash ?? row.contentHash ?? '',
      contentDiff: row.content_diff ?? null,
      changeDescription: row.change_description ?? null,
      previousVersionId: row.previous_version_id ?? null,
      createdBy: row.created_by ?? null,
      createdAt: new Date(row.created_at),
    } as any);
  }
}
