/**
 * SQLite Repository Repository Implementation
 * Repository 鑱氬悎鏍圭殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Repository } from '../../../domain-server/aggregates/repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import { RepositoryConfig } from '../../../domain-shared/value-objects/repository-config';
import { RepositoryStats } from '../../../domain-shared/value-objects/repository-stats';

export class SqliteRepositoryRepository implements IRepositoryRepository {
  constructor(private db: Database.Database) {}

  async save(repository: Repository): Promise<void> {
    const dto = repository.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO repositories (
        uuid, accountUuid, name, description, type, status, config,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        type = excluded.type,
        status = excluded.status,
        config = excluded.config,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.name,
      dto.description || null,
      dto.type,
      dto.status,
      dto.config || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<Repository | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE uuid = ? LIMIT 1`,
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    const config = row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO());
    const stats = row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO());

    return Repository.fromPersistenceDTO({
      id: row.uuid,
      identityId: row.accountUuid,
      name: row.name,
      description: row.description,
      type: row.type,
      path: row.path ?? null,
      status: row.status,
      config,
      stats,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      version: row.version ?? 1,
      deletedAt: row.deletedAt ?? null,
    });
  }

  async findByUuid(uuid: string): Promise<Repository | null> {
    return this.findById(uuid);
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE accountUuid = ? ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      Repository.fromPersistenceDTO({
        id: row.uuid,
        identityId: row.accountUuid,
        name: row.name,
        description: row.description,
        type: row.type,
        path: row.path ?? null,
        status: row.status,
        config: row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO()),
        stats: row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO()),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        version: row.version ?? 1,
        deletedAt: row.deletedAt ?? null,
      }),
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    return this.findByIdentityId(accountUuid);
  }

  async findByIdentityIdAndStatus(
    identityId: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE accountUuid = ? AND status = ? ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) =>
      Repository.fromPersistenceDTO({
        id: row.uuid,
        identityId: row.accountUuid,
        name: row.name,
        description: row.description,
        type: row.type,
        path: row.path ?? null,
        status: row.status,
        config: row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO()),
        stats: row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO()),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        version: row.version ?? 1,
        deletedAt: row.deletedAt ?? null,
      }),
    );
  }

  async findByAccountUuidAndStatus(
    accountUuid: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    return this.findByIdentityIdAndStatus(accountUuid, status);
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM repositories WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM repositories WHERE uuid = ? LIMIT 1`,
    );
    return stmt.get(uuid) !== undefined;
  }
}

