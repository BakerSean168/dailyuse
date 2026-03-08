/**
 * SQLite Folder Repository Implementation
 * Folder 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Folder } from '../../../domain-server/entities/folder';
import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
import { FolderSqliteMapper } from './mappers/folder-sqlite.mapper';

export class SqliteFolderRepository implements IFolderRepository {
  constructor(private db: Database.Database) {}

  async save(folder: Folder): Promise<void> {
    const stmt = this.db.prepare(`
       INSERT INTO folders (
        id, repository_id, identity_id, parent_id, name, path,
        "order", is_expanded, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        path = excluded.path,
        "order" = excluded."order",
        is_expanded = excluded.is_expanded,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      String(folder.id),
      folder.repositoryId,
      folder.identityId || null,
      folder.parentId || null,
      folder.name,
      folder.path,
      folder.order,
      folder.isExpanded ? 1 : 0,
      JSON.stringify(folder.metadata.toDTO()),
      folder.createdAt.getTime(),
      folder.updatedAt.getTime(),
    );
  }

  async findById(id: string): Promise<Folder | null> {
    const stmt = this.db.prepare(`SELECT * FROM folders WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return FolderSqliteMapper.toDomain(row);
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(`SELECT * FROM folders WHERE repository_id = ? ORDER BY path ASC`);
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => FolderSqliteMapper.toDomain(row));
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(`SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC`);
    const rows = stmt.all(parentId) as any[];

    return rows.map((row) => FolderSqliteMapper.toDomain(row));
  }

  async findByAccountId(identityId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT f.* FROM folders f
       JOIN repositories r ON f.repository_id = r.id
       WHERE r.identityId = ?
       ORDER BY f.path ASC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => FolderSqliteMapper.toDomain(row));
  }

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM folders WHERE repository_id = ? AND path = ? LIMIT 1`,
    );
    return stmt.get(repositoryId, path) !== undefined;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM folders WHERE id = ?`);
    stmt.run(id);
  }

  async findRootFolders(repositoryId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM folders WHERE repository_id = ? AND parent_id IS NULL ORDER BY name ASC`,
    );
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => FolderSqliteMapper.toDomain(row));
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM folders WHERE repository_id = ?`);
    stmt.run(repositoryId);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM folders WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }
}
