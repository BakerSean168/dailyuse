/**
 * SQLite Folder Repository Implementation
 * Folder 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Folder } from '@dailyuse/domain-server/repository';
import type { IFolderRepository } from '@dailyuse/domain-server/repository';

export class SqliteFolderRepository implements IFolderRepository {
  constructor(private db: Database.Database) {}

  async save(folder: Folder): Promise<void> {
    const dto = folder.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO folders (
        uuid, repository_uuid, parent_uuid, name, path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        path = excluded.path,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.repositoryUuid,
      dto.parentUuid || null,
      dto.name,
      dto.path,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<Folder | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE uuid = ? LIMIT 1`,
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Folder.fromPersistenceDTO({
      uuid: row.uuid,
      repositoryUuid: row.repository_uuid,
      parentUuid: row.parent_uuid,
      name: row.name,
      path: row.path,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE repository_uuid = ? ORDER BY path ASC`,
    );
    const rows = stmt.all(repositoryUuid) as any[];

    return rows.map((row) =>
      Folder.fromPersistenceDTO({
        uuid: row.uuid,
        repositoryUuid: row.repository_uuid,
        parentUuid: row.parent_uuid,
        name: row.name,
        path: row.path,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }),
    );
  }

  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE parent_uuid = ? ORDER BY name ASC`,
    );
    const rows = stmt.all(parentUuid) as any[];

    return rows.map((row) =>
      Folder.fromPersistenceDTO({
        uuid: row.uuid,
        repositoryUuid: row.repository_uuid,
        parentUuid: row.parent_uuid,
        name: row.name,
        path: row.path,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }),
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT f.* FROM folders f
       JOIN repositories r ON f.repository_uuid = r.uuid
       WHERE r.accountUuid = ?
       ORDER BY f.path ASC`,
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Folder.fromPersistenceDTO({
        uuid: row.uuid,
        repositoryUuid: row.repository_uuid,
        parentUuid: row.parent_uuid,
        name: row.name,
        path: row.path,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }),
    );
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM folders WHERE repository_uuid = ? AND path = ? LIMIT 1`,
    );
    return stmt.get(repositoryUuid, path) !== undefined;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM folders WHERE uuid = ?`);
    stmt.run(uuid);
  }
}

