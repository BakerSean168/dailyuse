/**
 * SQLite Resource Repository Implementation
 * Resource 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Resource } from '../../../domain-server/entities/resource';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import { ResourceSqliteMapper } from './mappers/resource-sqlite.mapper';

export class SqliteResourceRepository implements IResourceRepository {
  constructor(private db: Database.Database) {}

  async save(resource: Resource): Promise<void> {
    const stmt = this.db.prepare(`
       INSERT INTO resources (
        id, repository_id, identity_id, folder_id, name, type, path, size,
        content, metadata, stats, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      resource.identityId || '',
      resource.folderId ? String(resource.folderId) : null,
      resource.name,
      resource.type,
      resource.path,
      resource.size || 0,
      resource.content || null,
      JSON.stringify(resource.metadata),
      JSON.stringify(resource.stats),
      resource.status,
      resource.createdAt.getTime(),
      resource.updatedAt.getTime(),
    );
  }

  async findById(id: string): Promise<Resource | null> {
    const stmt = this.db.prepare(`SELECT * FROM resources WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return ResourceSqliteMapper.toDomain(row);
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE repository_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => ResourceSqliteMapper.toDomain(row));
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(`SELECT * FROM resources WHERE folder_id = ? ORDER BY name ASC`);
    const rows = stmt.all(folderId) as any[];

    return rows.map((row) => ResourceSqliteMapper.toDomain(row));
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT r.* FROM resources r
       JOIN repositories repo ON r.repository_id = repo.id
       WHERE repo.identityId = ?
       ORDER BY r.createdAt DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => ResourceSqliteMapper.toDomain(row));
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
