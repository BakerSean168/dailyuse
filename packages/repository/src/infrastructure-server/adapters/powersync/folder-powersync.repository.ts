import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { Folder } from '../../../domain-server/entities/folder';
import type { IFolderRepository } from '../../../domain-server/repositories/i-folder-repository';
import { PowerSyncFolderMapper, type PowerSyncFolderRow } from './mappers/powersync-folder.mapper';

export class PowerSyncFolderRepository implements IFolderRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(folder: Folder): Promise<void> {
    const d = PowerSyncFolderMapper.toPersistence(folder);
    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM folders WHERE id = ? LIMIT 1`,
      [d.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE folders
         SET repository_id = ?,
             identity_id = ?,
             parent_id = ?,
             name = ?,
             path = ?,
             "order" = ?,
             is_expanded = ?,
             metadata = ?,
             updated_at = ?
         WHERE id = ?`,
        [
          d.repository_id,
          d.identity_id,
          d.parent_id,
          d.name,
          d.path,
          d.order,
          d.is_expanded,
          d.metadata,
          d.updated_at,
          d.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO folders (
           id, repository_id, identity_id, parent_id, name, path,
           "order", is_expanded, metadata, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id,
          d.repository_id,
          d.identity_id,
          d.parent_id,
          d.name,
          d.path,
          d.order,
          d.is_expanded,
          d.metadata,
          d.created_at,
          d.updated_at,
        ],
      );
    }
  }

  async findById(id: string): Promise<Folder | null> {
    const row = await this.db.getOptional<PowerSyncFolderRow>(
      `SELECT * FROM folders WHERE id = ? LIMIT 1`,
      [id],
    );
    return row ? PowerSyncFolderMapper.toDomain(row) : null;
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    const rows = await this.db.getAll<PowerSyncFolderRow>(
      `SELECT * FROM folders WHERE repository_id = ? ORDER BY path ASC`,
      [repositoryId],
    );
    return rows.map((row) => PowerSyncFolderMapper.toDomain(row));
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    const rows = await this.db.getAll<PowerSyncFolderRow>(
      `SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC`,
      [parentId],
    );
    return rows.map((row) => PowerSyncFolderMapper.toDomain(row));
  }

  async findRootFolders(repositoryId: string): Promise<Folder[]> {
    const rows = await this.db.getAll<PowerSyncFolderRow>(
      `SELECT * FROM folders WHERE repository_id = ? AND parent_id IS NULL ORDER BY name ASC`,
      [repositoryId],
    );
    return rows.map((row) => PowerSyncFolderMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM folders WHERE id = ?`, [id]);
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    await this.db.execute(`DELETE FROM folders WHERE repository_id = ?`, [repositoryId]);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ one: number }>(
      `SELECT 1 as one FROM folders WHERE id = ? LIMIT 1`,
      [id],
    );
    return row !== null;
  }
}
