/**
 * SQLite Folder Repository Implementation
 * Folder 瀹炰綋鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { Folder, type FolderState } from '../../../domain-server/entities/folder';
import { ResourceId } from '../../../domain-shared/value-objects/resource-id';
import { FolderMetadata } from '../../../domain-shared/value-objects/folder-metadata';
import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';

export class SqliteFolderRepository implements IFolderRepository {
  constructor(private db: Database.Database) {}

  async save(folder: Folder): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO folders (
        id, repository_id, parent_id, name, path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        path = excluded.path,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      String(folder.id),
      folder.repositoryId,
      folder.parentId || null,
      folder.name,
      folder.path,
      folder.createdAt.getTime(),
      folder.updatedAt.getTime(),
    );
  }

  async findById(id: string): Promise<Folder | null> {
    const stmt = this.db.prepare(`SELECT * FROM folders WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapToDomain(row);
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(`SELECT * FROM folders WHERE repository_id = ? ORDER BY path ASC`);
    const rows = stmt.all(repositoryId) as any[];

    return rows.map((row) => this.mapToDomain(row));
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(`SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC`);
    const rows = stmt.all(parentId) as any[];

    return rows.map((row) => this.mapToDomain(row));
  }

  async findByAccountId(identityId: string): Promise<Folder[]> {
    const stmt = this.db.prepare(
      `SELECT f.* FROM folders f
       JOIN repositories r ON f.repository_id = r.id
       WHERE r.identityId = ?
       ORDER BY f.path ASC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.mapToDomain(row));
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

    return rows.map((row) => this.mapToDomain(row));
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM folders WHERE repository_id = ?`);
    stmt.run(repositoryId);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM folders WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  private mapToDomain(row: any): Folder {
    const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

    return Folder.load({
      id: ResourceId.of(row.id),
      repositoryId: row.repository_id,
      parentId: row.parent_id,
      name: row.name,
      path: row.path,
      order: row.order ?? 0,
      isExpanded: row.is_expanded ?? false,
      metadata: FolderMetadata.fromDTO(JSON.parse(metadata)),
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
      children: null,
    });
  }
}
