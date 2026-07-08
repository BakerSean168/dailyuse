import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { Resource } from '../../../domain/entities/resource';
import type { IResourceRepository } from '../../../domain/repositories/i-resource-repository';
import {
  PowerSyncResourceMapper,
  type PowerSyncResourceRow,
} from './mappers/powersync-resource.mapper';

export class PowerSyncResourceRepository implements IResourceRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(resource: Resource): Promise<void> {
    const d = PowerSyncResourceMapper.toPersistence(resource);
    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM resources WHERE id = ? LIMIT 1`,
      [d.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE resources
         SET repository_id = ?,
             identity_id = ?,
             folder_id = ?,
             name = ?,
             type = ?,
             path = ?,
             size = ?,
             content = ?,
             metadata = ?,
             stats = ?,
             status = ?,
             updated_at = ?,
             version = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          d.repository_id,
          d.identity_id,
          d.folder_id,
          d.name,
          d.type,
          d.path,
          d.size,
          d.content,
          d.metadata,
          d.stats,
          d.status,
          d.updated_at,
          d.version,
          d.deleted_at,
          d.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO resources (
           id, repository_id, identity_id, folder_id, name, type, path, size,
           content, metadata, stats, status, created_at, updated_at, version, deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id,
          d.repository_id,
          d.identity_id,
          d.folder_id,
          d.name,
          d.type,
          d.path,
          d.size,
          d.content,
          d.metadata,
          d.stats,
          d.status,
          d.created_at,
          d.updated_at,
          d.version,
          d.deleted_at,
        ],
      );
    }
  }

  async findById(id: string): Promise<Resource | null> {
    const row = await this.db.getOptional<PowerSyncResourceRow>(
      `SELECT * FROM resources WHERE id = ? LIMIT 1`,
      [id],
    );
    return row ? PowerSyncResourceMapper.toDomain(row) : null;
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    const rows = await this.db.getAll<PowerSyncResourceRow>(
      `SELECT * FROM resources WHERE repository_id = ? ORDER BY created_at DESC`,
      [repositoryId],
    );
    return rows.map((row) => PowerSyncResourceMapper.toDomain(row));
  }

  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<Resource | null> {
    const row = await this.db.getOptional<PowerSyncResourceRow>(
      `SELECT * FROM resources WHERE repository_id = ? AND path = ? LIMIT 1`,
      [repositoryId, path],
    );
    return row ? PowerSyncResourceMapper.toDomain(row) : null;
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    const rows = await this.db.getAll<PowerSyncResourceRow>(
      `SELECT * FROM resources WHERE folder_id = ? ORDER BY name ASC`,
      [folderId],
    );
    return rows.map((row) => PowerSyncResourceMapper.toDomain(row));
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    const rows = await this.db.getAll<PowerSyncResourceRow>(
      `SELECT r.* FROM resources r
       JOIN repositories repo ON r.repository_id = repo.id
       WHERE repo.identity_id = ?
       ORDER BY r.created_at DESC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncResourceMapper.toDomain(row));
  }

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    const row = await this.db.getOptional<{ one: number }>(
      `SELECT 1 as one FROM resources WHERE repository_id = ? AND path = ? LIMIT 1`,
      [repositoryId, path],
    );
    return row !== null;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM resources WHERE id = ?`, [id]);
  }
}
