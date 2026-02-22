/**
 * SQLite Resource Repository Implementation
 * Resource 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import type { FolderId } from '@dailyuse/contracts/primitives';
import { Resource, type ResourceState } from '../../../domain-server/entities/resource';
import { ResourceId } from '../../../domain-shared/value-objects/resource-id';
import { RepositoryId } from '../../../domain-shared/value-objects/repository-id';
import { ResourceMetadata } from '../../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../../domain-shared/value-objects/resource-stats';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';

export class SqliteResourceRepository implements IResourceRepository {
  constructor(private db: Database.Database) {}

  async save(resource: Resource): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO resources (
        id, repository_id, folder_id, name, type, path, size,
        content, metadata, stats, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        path = excluded.path,
        size = excluded.size,
        content = excluded.content,
        metadata = excluded.metadata,
        stats = excluded.stats,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      String(resource.id),
      String(resource.repositoryId),
      resource.folderId ? String(resource.folderId) : null,
      resource.name,
      resource.type,
      resource.path,
      resource.size || 0,
      resource.content || null,
      JSON.stringify(resource.metadata),
      JSON.stringify(resource.stats),
      resource.status,
      resource.createdAt,
      resource.updatedAt,
    );
  }

  async findById(id: string): Promise<Resource | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE id = ? LIMIT 1`,
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapToDomain(row);
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE repository_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => this.mapToDomain(row));
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE folder_id = ? ORDER BY name ASC`,
    );
    const rows = stmt.all(folderId) as any[];

    return rows.map((row) => this.mapToDomain(row));
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT r.* FROM resources r
       JOIN repositories repo ON r.repository_id = repo.id
       WHERE repo.identityId = ?
       ORDER BY r.createdAt DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.mapToDomain(row));
  }

  async findByAccountId(identityId: string): Promise<Resource[]> {
    return this.findByIdentityId(identityId);
  }

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM resources WHERE repository_id = ? AND path = ? LIMIT 1`,
    );
    return stmt.get(repositoryId, path) !== undefined;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM resources WHERE id = ?`);
    stmt.run(id);
  }

  private mapToDomain(row: any): Resource {
    const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
    const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());

    return Resource.load({
      id: ResourceId.of(row.id),
      repositoryId: RepositoryId.of(row.repository_id),
      folderId: row.folder_id ? (row.folder_id as FolderId) : null,
      type: row.type,
      name: row.name,
      path: row.path,
      mimeType: row.mime_type ?? null,
      size: row.size,
      content: row.content,
      childrenCount: null,
      metadata: ResourceMetadata.fromDTO(JSON.parse(metadata)),
      stats: ResourceStats.fromDTO(JSON.parse(stats)),
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
      version: row.version ?? 1,
      deletedAt: row.deleted_at ? (row.deleted_at instanceof Date ? row.deleted_at : new Date(row.deleted_at)) : null,
      externalLinks: null,
    });
  }
}

