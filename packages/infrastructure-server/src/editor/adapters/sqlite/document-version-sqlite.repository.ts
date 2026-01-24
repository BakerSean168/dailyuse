/**
 * SQLite DocumentVersion Repository Implementation
 * 鏂囨。鐗堟湰鐨?SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { DocumentVersion } from '@dailyuse/domain-server/editor';
import type { IDocumentVersionRepository, VersionChangeType } from '@dailyuse/domain-server/editor';

export class SqliteDocumentVersionRepository implements IDocumentVersionRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(`SELECT * FROM document_versions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return DocumentVersion.fromPersistenceDTO({
      uuid: row.uuid,
      document_uuid: row.document_uuid,
      version_number: row.version_number,
      change_type: row.change_type as VersionChangeType,
      content: row.content,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByDocumentUuid(documentUuid: string): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_uuid = ? ORDER BY version_number DESC`
    );
    const rows = stmt.all(documentUuid) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async findLatestByDocumentUuid(documentUuid: string): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_uuid = ? ORDER BY version_number DESC LIMIT 1`
    );
    const row = stmt.get(documentUuid) as any;

    if (!row) return null;

    return DocumentVersion.fromPersistenceDTO({
      uuid: row.uuid,
      document_uuid: row.document_uuid,
      version_number: row.version_number,
      change_type: row.change_type as VersionChangeType,
      content: row.content,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByDocumentUuidAndVersionNumber(
    documentUuid: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_uuid = ? AND version_number = ? LIMIT 1`
    );
    const row = stmt.get(documentUuid, versionNumber) as any;

    if (!row) return null;

    return DocumentVersion.fromPersistenceDTO({
      uuid: row.uuid,
      document_uuid: row.document_uuid,
      version_number: row.version_number,
      change_type: row.change_type as VersionChangeType,
      content: row.content,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByChangeType(documentUuid: string, changeType: VersionChangeType): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_uuid = ? AND change_type = ? ORDER BY version_number DESC`
    );
    const rows = stmt.all(documentUuid, changeType) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async findByTimeRange(
    documentUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM document_versions WHERE document_uuid = ? AND createdAt >= ? AND createdAt <= ? ORDER BY version_number ASC`
    );
    const rows = stmt.all(documentUuid, startTime, endTime) as any[];

    return rows.map((row) => this.rowToVersion(row));
  }

  async save(version: DocumentVersion): Promise<void> {
    const dto = version.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO document_versions (
        uuid, document_uuid, version_number, change_type, content,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        content = excluded.content,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.document_uuid,
      dto.version_number,
      dto.change_type,
      dto.content,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM document_versions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteOlderThan(documentUuid: string, beforeTime: number): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM document_versions WHERE document_uuid = ? AND createdAt < ?`
    );
    stmt.run(documentUuid, beforeTime);
  }

  private rowToVersion(row: any): DocumentVersion {
    return DocumentVersion.fromPersistenceDTO({
      uuid: row.uuid,
      document_uuid: row.document_uuid,
      version_number: row.version_number,
      change_type: row.change_type as VersionChangeType,
      content: row.content,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

