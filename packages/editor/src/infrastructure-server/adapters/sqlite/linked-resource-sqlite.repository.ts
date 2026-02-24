/**
 * SQLite LinkedResource Repository Implementation
 */

import type Database from 'better-sqlite3';
import { LinkedResource } from '../../../domain-server/entities/linked-resource';
import type { ILinkedResourceRepository } from '../../../domain-server/repositories/ILinkedResourceRepository';
import type { LinkedSourceType, LinkedTargetType } from '@dailyuse/contracts/editor';

export class SqliteLinkedResourceRepository implements ILinkedResourceRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<LinkedResource | null> {
    const stmt = this.db.prepare(`SELECT * FROM linked_resources WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToResource(row);
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

  async findNeedingValidation(threshold: number): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources
       WHERE last_verified_at IS NULL OR last_verified_at < ?
       ORDER BY last_verified_at ASC`
    );
    const rows = stmt.all(Date.now() - threshold) as any[];

    return rows.map((row) => this.rowToResource(row));
  }

  async save(resource: LinkedResource): Promise<void> {
    const dto = resource.toServerDTO();

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
      dto.sourceDocumentId,
      dto.targetDocumentId,
      dto.sourceType,
      dto.targetType,
      dto.isValid ? 1 : 0,
      dto.lastValidatedAt ? new Date(dto.lastValidatedAt).getTime() : null,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM linked_resources WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(resources: LinkedResource[]): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO linked_resources (
        id, source_document_id, target_document_id, source_type,
        target_type, is_valid, last_verified_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_valid = excluded.is_valid,
        last_verified_at = excluded.last_verified_at,
        updatedAt = excluded.updatedAt
    `);
    const trx = this.db.transaction(() => {
      for (const resource of resources) {
        const dto = resource.toServerDTO();
        insert.run(
          dto.id,
          dto.sourceDocumentId,
          dto.targetDocumentId,
          dto.sourceType,
          dto.targetType,
          dto.isValid ? 1 : 0,
          dto.lastValidatedAt ? new Date(dto.lastValidatedAt).getTime() : null,
          new Date(dto.createdAt),
          new Date(dto.updatedAt),
        );
      }
    });
    trx();
  }

  async deleteBySourceDocumentId(sourceDocumentId: string): Promise<void> {
    this.db.prepare(`DELETE FROM linked_resources WHERE source_document_id = ?`).run(sourceDocumentId);
  }

  async deleteByTargetDocumentId(targetDocumentId: string): Promise<void> {
    this.db.prepare(`DELETE FROM linked_resources WHERE target_document_id = ?`).run(targetDocumentId);
  }

  async countBySourceDocumentId(sourceDocumentId: string): Promise<number> {
    const row = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM linked_resources WHERE source_document_id = ?`)
      .get(sourceDocumentId) as { cnt: number };
    return row.cnt;
  }

  async countInvalid(workspaceId: string): Promise<number> {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as cnt FROM linked_resources
         WHERE is_valid = 0 AND source_document_id IN (
           SELECT id FROM documents WHERE workspace_id = ?
         )`,
      )
      .get(workspaceId) as { cnt: number };
    return row.cnt;
  }

  private rowToResource(row: any): LinkedResource {
    return LinkedResource.load({
      id: row.id,
      workspaceId: row.workspace_id ?? '',
      identityId: row.identityId ?? row.identity_id ?? '',
      sourceDocumentId: row.source_document_id,
      sourceType: row.source_type,
      sourceLine: row.source_line ?? null,
      sourceColumn: row.source_column ?? null,
      targetPath: row.target_path ?? '',
      targetType: row.target_type,
      targetDocumentId: row.target_document_id,
      targetAnchor: row.target_anchor ?? null,
      isValid: row.is_valid === 1,
      lastValidatedAt: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as any);
  }
}


