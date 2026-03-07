/**
 * SQLite LinkedResource Repository Implementation
 */

import type Database from 'better-sqlite3';
import { LinkedResource } from '../../../domain-server/entities/linked-resource';
import type { ILinkedResourceRepository } from '../../../domain-server/repositories/ILinkedResourceRepository';
import type { LinkedSourceType, LinkedTargetType } from '@dailyuse/contracts/editor';
import { LinkedResourceSqliteMapper } from './mappers/linked-resource-sqlite.mapper';

export class SqliteLinkedResourceRepository implements ILinkedResourceRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<LinkedResource | null> {
    const stmt = this.db.prepare(`SELECT * FROM linked_resources WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return LinkedResourceSqliteMapper.toDomain(row);
  }

  async findBySourceDocumentId(sourceDocumentId: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(sourceDocumentId) as any[];

    return rows.map((row) => LinkedResourceSqliteMapper.toDomain(row));
  }

  async findByTargetDocumentId(targetDocumentId: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE target_document_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(targetDocumentId) as any[];

    return rows.map((row) => LinkedResourceSqliteMapper.toDomain(row));
  }

  async findBySourceType(
    sourceDocumentId: string,
    sourceType: LinkedSourceType,
  ): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_id = ? AND source_type = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(sourceDocumentId, sourceType) as any[];

    return rows.map((row) => LinkedResourceSqliteMapper.toDomain(row));
  }

  async findByTargetType(
    sourceDocumentId: string,
    targetType: LinkedTargetType,
  ): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources WHERE source_document_id = ? AND target_type = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(sourceDocumentId, targetType) as any[];

    return rows.map((row) => LinkedResourceSqliteMapper.toDomain(row));
  }

  async findInvalid(workspaceId: string): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT lr.* FROM linked_resources lr
       WHERE lr.is_valid = 0 AND lr.source_document_id IN (
         SELECT id FROM documents WHERE workspace_id = ?
       ) ORDER BY lr.created_at DESC`,
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => LinkedResourceSqliteMapper.toDomain(row));
  }

  async findNeedingValidation(threshold: number): Promise<LinkedResource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM linked_resources
       WHERE last_verified_at IS NULL OR last_verified_at < ?
       ORDER BY last_verified_at ASC`,
    );
    const rows = stmt.all(Date.now() - threshold) as any[];

    return rows.map((row) => LinkedResourceSqliteMapper.toDomain(row));
  }

  async save(resource: LinkedResource): Promise<void> {
    const dto = resource.toServerDTO();

    const stmt = this.db.prepare(`
       INSERT INTO linked_resources (
        id, identity_id, source_document_id, target_document_id, source_type,
        target_type, is_valid, last_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_valid = excluded.is_valid,
        last_verified_at = excluded.last_verified_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.identityId || '',
      dto.sourceDocumentId,
      dto.targetDocumentId,
      dto.sourceType,
      dto.targetType,
      dto.isValid ? 1 : 0,
      dto.lastValidatedAt ?? null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM linked_resources WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(resources: LinkedResource[]): Promise<void> {
    const insert = this.db.prepare(`
       INSERT INTO linked_resources (
        id, identity_id, source_document_id, target_document_id, source_type,
        target_type, is_valid, last_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_valid = excluded.is_valid,
        last_verified_at = excluded.last_verified_at,
        updated_at = excluded.updated_at
    `);
    const trx = this.db.transaction(() => {
      for (const resource of resources) {
        const dto = resource.toServerDTO();
        insert.run(
          dto.id,
          dto.identityId || '',
          dto.sourceDocumentId,
          dto.targetDocumentId,
          dto.sourceType,
          dto.targetType,
          dto.isValid ? 1 : 0,
          dto.lastValidatedAt ?? null,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });
    trx();
  }

  async deleteBySourceDocumentId(sourceDocumentId: string): Promise<void> {
    this.db
      .prepare(`DELETE FROM linked_resources WHERE source_document_id = ?`)
      .run(sourceDocumentId);
  }

  async deleteByTargetDocumentId(targetDocumentId: string): Promise<void> {
    this.db
      .prepare(`DELETE FROM linked_resources WHERE target_document_id = ?`)
      .run(targetDocumentId);
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
}
