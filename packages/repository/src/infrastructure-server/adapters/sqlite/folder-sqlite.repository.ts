/**
 * SQLite Folder Repository Implementation
 * Folder 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Folder } from '../../../domain-server/entities/folder';
import { FolderMetadata } from '../../../domain-shared/value-objects/folder-metadata';
import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';

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
      dto.id,
      dto.repositoryId,
      dto.parentId || null,
      dto.name,
      dto.path,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<Folder | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE uuid = ? LIMIT 1`,
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

    return Folder.fromPersistenceDTO({
      id: row.uuid,
      repositoryId: row.repository_uuid,
      parentId: row.parent_uuid,
      name: row.name,
      path: row.path,
      order: row.order ?? 0,
      isExpanded: row.is_expanded ?? false,
      metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async findByUuid(uuid: string): Promise<Folder | null> {
    return this.findById(uuid);
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE repository_uuid = ? ORDER BY path ASC`,
    );
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

      return Folder.fromPersistenceDTO({
        id: row.uuid,
        repositoryId: row.repository_uuid,
        parentId: row.parent_uuid,
        name: row.name,
        path: row.path,
        order: row.order ?? 0,
        isExpanded: row.is_expanded ?? false,
        metadata,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    return this.findByRepositoryId(repositoryUuid);
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE parent_uuid = ? ORDER BY name ASC`,
    );
    const rows = stmt.all(parentId) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

      return Folder.fromPersistenceDTO({
        id: row.uuid,
        repositoryId: row.repository_uuid,
        parentId: row.parent_uuid,
        name: row.name,
        path: row.path,
        order: row.order ?? 0,
        isExpanded: row.is_expanded ?? false,
        metadata,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });
  }

  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    return this.findByParentId(parentUuid);
  }

  async findByAccountUuid(accountUuid: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT f.* FROM folders f
       JOIN repositories r ON f.repository_uuid = r.uuid
       WHERE r.accountUuid = ?
       ORDER BY f.path ASC`,
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

      return Folder.fromPersistenceDTO({
        id: row.uuid,
        repositoryId: row.repository_uuid,
        parentId: row.parent_uuid,
        name: row.name,
        path: row.path,
        order: row.order ?? 0,
        isExpanded: row.is_expanded ?? false,
        metadata,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM folders WHERE repository_uuid = ? AND path = ? LIMIT 1`,
    );
    return stmt.get(repositoryUuid, path) !== undefined;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM folders WHERE uuid = ?`);
    stmt.run(id);
  }

  async findRootFolders(repositoryId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE repository_uuid = ? AND parent_uuid IS NULL ORDER BY name ASC`
    );
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => {
      const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

      return Folder.fromPersistenceDTO({
        id: row.uuid,
        repositoryId: row.repository_uuid,
        parentId: row.parent_uuid,
        name: row.name,
        path: row.path,
        order: row.order ?? 0,
        isExpanded: row.is_expanded ?? false,
        metadata,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM folders WHERE repository_uuid = ?`);
    stmt.run(repositoryId);
  }

  async deleteByRepositoryUuid(repositoryUuid: string): Promise<void> {
    await this.deleteByRepositoryId(repositoryUuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM folders WHERE uuid = ? LIMIT 1`
    );
    return stmt.get(uuid) !== undefined;
  }
}

