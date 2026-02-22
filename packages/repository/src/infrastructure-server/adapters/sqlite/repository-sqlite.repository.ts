/**
 * SQLite Repository Repository Implementation
 * Repository 鑱氬悎鏍圭殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Repository, type RepositoryState } from '../../../domain-server/aggregates/repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import { RepositoryId } from '../../../domain-shared/value-objects/repository-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { RepositoryConfig } from '../../../domain-shared/value-objects/repository-config';
import { RepositoryStats } from '../../../domain-shared/value-objects/repository-stats';

export class SqliteRepositoryRepository implements IRepositoryRepository {
  constructor(private db: Database.Database) {}

  async save(repository: Repository): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO repositories (
        id, identityId, name, description, type, status, config,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        type = excluded.type,
        status = excluded.status,
        config = excluded.config,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      String(repository.id),
      String(repository.identityId),
      repository.name,
      repository.description || null,
      repository.type,
      repository.status,
      JSON.stringify(repository.config),
      repository.createdAt,
      repository.updatedAt,
    );
  }

  async findById(id: string): Promise<Repository | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE id = ? LIMIT 1`,
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    const config = row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO());
    const stats = row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO());

    return Repository.load({
      id: RepositoryId.of(row.id),
      identityId: IdentityId.of(row.identityId),
      name: row.name,
      description: row.description,
      type: row.type,
      path: row.path ?? null,
      status: row.status,
      config: RepositoryConfig.fromDTO(JSON.parse(config)),
      stats: RepositoryStats.fromDTO(JSON.parse(stats)),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      version: row.version ?? 1,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    });
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE identityId = ? ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      Repository.load({
        id: RepositoryId.of(row.id),
        identityId: IdentityId.of(row.identityId),
        name: row.name,
        description: row.description,
        type: row.type,
        path: row.path ?? null,
        status: row.status,
        config: RepositoryConfig.fromDTO(JSON.parse(row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO()))),
        stats: RepositoryStats.fromDTO(JSON.parse(row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO()))),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        version: row.version ?? 1,
        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      }),
    );
  }

  async findByAccountId(identityId: string): Promise<Repository[]> {
    return this.findByIdentityId(identityId);
  }

  async findByIdentityIdAndStatus(
    identityId: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE identityId = ? AND status = ? ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) =>
      Repository.load({
        id: RepositoryId.of(row.id),
        identityId: IdentityId.of(row.identityId),
        name: row.name,
        description: row.description,
        type: row.type,
        path: row.path ?? null,
        status: row.status,
        config: RepositoryConfig.fromDTO(JSON.parse(row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO()))),
        stats: RepositoryStats.fromDTO(JSON.parse(row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO()))),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        version: row.version ?? 1,
        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM repositories WHERE id = ?`);
    stmt.run(id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM repositories WHERE id = ? LIMIT 1`,
    );
    return stmt.get(id) !== undefined;
  }
}

