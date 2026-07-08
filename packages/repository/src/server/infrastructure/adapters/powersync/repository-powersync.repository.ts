import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { Repository } from '../../../domain/aggregates/repository';
import type { IRepositoryRepository } from '../../../domain/repositories/i-repository-repository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import {
  PowerSyncRepositoryMapper,
  type PowerSyncRepositoryRow,
} from './mappers/powersync-repository.mapper';

export class PowerSyncRepositoryRepository implements IRepositoryRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(repository: Repository): Promise<void> {
    const d = PowerSyncRepositoryMapper.toPersistence(repository);
    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM repositories WHERE id = ? LIMIT 1`,
      [d.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE repositories
         SET identity_id = ?,
             name = ?,
             description = ?,
             type = ?,
             path = ?,
             status = ?,
             config = ?,
             stats = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          d.identity_id,
          d.name,
          d.description,
          d.type,
          d.path,
          d.status,
          d.config,
          d.stats,
          d.version,
          d.updated_at,
          d.deleted_at,
          d.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO repositories (
           id, identity_id, name, description, type, path, status, config, stats,
           version, created_at, updated_at, deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id,
          d.identity_id,
          d.name,
          d.description,
          d.type,
          d.path,
          d.status,
          d.config,
          d.stats,
          d.version,
          d.created_at,
          d.updated_at,
          d.deleted_at,
        ],
      );
    }
  }

  async findById(id: string): Promise<Repository | null> {
    const row = await this.db.getOptional<PowerSyncRepositoryRow>(
      `SELECT * FROM repositories WHERE id = ? LIMIT 1`,
      [id],
    );
    return row ? PowerSyncRepositoryMapper.toDomain(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    const rows = await this.db.getAll<PowerSyncRepositoryRow>(
      `SELECT * FROM repositories WHERE identity_id = ? ORDER BY created_at DESC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncRepositoryMapper.toDomain(row));
  }

  async findByIdentityIdAndStatus(
    identityId: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const rows = await this.db.getAll<PowerSyncRepositoryRow>(
      `SELECT * FROM repositories WHERE identity_id = ? AND status = ? ORDER BY created_at DESC`,
      [identityId, status],
    );
    return rows.map((row) => PowerSyncRepositoryMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM repositories WHERE id = ?`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ one: number }>(
      `SELECT 1 as one FROM repositories WHERE id = ? LIMIT 1`,
      [id],
    );
    return row !== null;
  }
}
