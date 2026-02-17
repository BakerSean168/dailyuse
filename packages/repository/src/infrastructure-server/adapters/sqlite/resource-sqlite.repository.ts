/**
 * SQLite Resource Repository Implementation
 * Resource 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Resource } from '../../../domain-server/entities/resource';
import { ResourceMetadata } from '../../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../../domain-shared/value-objects/resource-stats';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';

export class SqliteResourceRepository implements IResourceRepository {
  constructor(private db: Database.Database) {}

  async save(resource: Resource): Promise<void> {
    const dto = resource.toPersistenceDTO();

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
      dto.id,
      dto.repositoryId,
      dto.folderId || null,
      dto.name,
      dto.type,
      dto.path,
      dto.size || 0,
      dto.content || null,
      dto.metadata || null,
      dto.stats || null,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<Resource | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE id = ? LIMIT 1`,
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
    const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());

    return Resource.fromPersistenceDTO({
      id: row.id,
      repositoryId: row.repository_id,
      folderId: row.folder_id,
      name: row.name,
      type: row.type,
      path: row.path,
      mimeType: row.mime_type ?? null,
      size: row.size,
      content: row.content,
      metadata,
      stats,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      version: row.version ?? 1,
      deletedAt: row.deleted_at ?? null,
    });
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE repository_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
      const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());

      return Resource.fromPersistenceDTO({
        id: row.id,
        repositoryId: row.repository_id,
        folderId: row.folder_id,
        name: row.name,
        type: row.type,
        path: row.path,
        mimeType: row.mime_type ?? null,
        size: row.size,
        content: row.content,
        metadata,
        stats,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        version: row.version ?? 1,
        deletedAt: row.deleted_at ?? null,
      });
    });
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE folder_id = ? ORDER BY name ASC`,
    );
    const rows = stmt.all(folderId) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
      const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());

      return Resource.fromPersistenceDTO({
        id: row.id,
        repositoryId: row.repository_id,
        folderId: row.folder_id,
        name: row.name,
        type: row.type,
        path: row.path,
        mimeType: row.mime_type ?? null,
        size: row.size,
        content: row.content,
        metadata,
        stats,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        version: row.version ?? 1,
        deletedAt: row.deleted_at ?? null,
      });
    });
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT r.* FROM resources r
       JOIN repositories repo ON r.repository_id = repo.id
       WHERE repo.identityId = ?
       ORDER BY r.createdAt DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
      const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());

      return Resource.fromPersistenceDTO({
        id: row.id,
        repositoryId: row.repository_id,
        folderId: row.folder_id,
        name: row.name,
        type: row.type,
        path: row.path,
        mimeType: row.mime_type ?? null,
        size: row.size,
        content: row.content,
        metadata,
        stats,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        version: row.version ?? 1,
        deletedAt: row.deleted_at ?? null,
      });
    });
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
}

