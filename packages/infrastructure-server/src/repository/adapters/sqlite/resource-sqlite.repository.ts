/**
 * SQLite Resource Repository Implementation
 * Resource 瀹炰綋鐨?SQLite 浠撳偍瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Resource } from '@dailyuse/domain-server/repository';
import type { IResourceRepository } from '@dailyuse/domain-server/repository';

export class SqliteResourceRepository implements IResourceRepository {
  constructor(private db: Database.Database) {}

  async save(resource: Resource): Promise<void> {
    const dto = resource.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO resources (
        uuid, repository_uuid, folder_uuid, name, type, path, size,
        content, metadata, stats, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
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
      dto.uuid,
      dto.repositoryUuid,
      dto.folderUuid || null,
      dto.name,
      dto.type,
      dto.path,
      dto.size || 0,
      dto.content || null,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.stats ? JSON.stringify(dto.stats) : null,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<Resource | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE uuid = ? LIMIT 1`,
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Resource.fromPersistenceDTO({
      uuid: row.uuid,
      repositoryUuid: row.repository_uuid,
      folderUuid: row.folder_uuid,
      name: row.name,
      type: row.type,
      path: row.path,
      size: row.size,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      stats: row.stats ? JSON.parse(row.stats) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async findById(uuid: string): Promise<Resource | null> {
    return this.findByUuid(uuid);
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE repository_uuid = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(repositoryUuid) as any[];

    return rows.map((row) =>
      Resource.fromPersistenceDTO({
        uuid: row.uuid,
        repository_uuid: row.repository_uuid,
        folder_uuid: row.folder_uuid,
        name: row.name,
        type: row.type,
        path: row.path,
        size: row.size,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        stats: row.stats ? JSON.parse(row.stats) : undefined,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }),
    );
  }

  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM resources WHERE folder_uuid = ? ORDER BY name ASC`,
    );
    const rows = stmt.all(folderUuid) as any[];

    return rows.map((row) =>
      Resource.fromPersistenceDTO({
        uuid: row.uuid,
        repositoryUuid: row.repository_uuid,
        folderUuid: row.folder_uuid,
        name: row.name,
        type: row.type,
        path: row.path,
        size: row.size,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        stats: row.stats ? JSON.parse(row.stats) : undefined,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }),
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<Resource[]> {
    const stmt = this.db.prepare(
      `SELECT r.* FROM resources r
       JOIN repositories repo ON r.repository_uuid = repo.uuid
       WHERE repo.accountUuid = ?
       ORDER BY r.createdAt DESC`,
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Resource.fromPersistenceDTO({
        uuid: row.uuid,
        repositoryUuid: row.repository_uuid,
        folderUuid: row.folder_uuid,
        name: row.name,
        type: row.type,
        path: row.path,
        size: row.size,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        stats: row.stats ? JSON.parse(row.stats) : undefined,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }),
    );
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM resources WHERE repository_uuid = ? AND path = ? LIMIT 1`,
    );
    return stmt.get(repositoryUuid, path) !== undefined;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM resources WHERE uuid = ?`);
    stmt.run(uuid);
  }
}

