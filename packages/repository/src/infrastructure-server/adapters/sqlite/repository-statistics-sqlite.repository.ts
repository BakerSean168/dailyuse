/**
 * SQLite Repository Statistics Repository Implementation
 * RepositoryStatistics 鑱氬悎鏍圭殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { RepositoryStatistics } from '../../../domain-server/aggregates/repository-statistics';
import type { IRepositoryStatisticsRepository } from '../../../domain-server/repositories/IRepositoryStatisticsRepository';

export class SqliteRepositoryStatisticsRepository implements IRepositoryStatisticsRepository {
  constructor(private db: Database.Database) {}

  async save(statistics: RepositoryStatistics): Promise<void> {
    const dto = statistics.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO repository_statistics (
        uuid, accountUuid, total_repositories, active_repositories,
        archived_repositories, total_resources, total_folders, total_tags,
        total_storage_bytes, last_updatedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        total_repositories = excluded.total_repositories,
        active_repositories = excluded.active_repositories,
        archived_repositories = excluded.archived_repositories,
        total_resources = excluded.total_resources,
        total_folders = excluded.total_folders,
        total_tags = excluded.total_tags,
        total_storage_bytes = excluded.total_storage_bytes,
        last_updatedAt = excluded.last_updatedAt,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.total_repositories,
      dto.active_repositories,
      dto.archived_repositories,
      dto.total_resources,
      dto.total_folders,
      dto.total_tags,
      dto.total_storage_bytes,
      dto.last_updatedAt,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<RepositoryStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM repository_statistics WHERE accountUuid = ? LIMIT 1`,
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return RepositoryStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      total_repositories: row.total_repositories,
      active_repositories: row.active_repositories,
      archived_repositories: row.archived_repositories,
      total_resources: row.total_resources,
      total_folders: row.total_folders,
      total_tags: row.total_tags,
      total_storage_bytes: row.total_storage_bytes,
      last_updated_at: row.last_updatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByUuid(uuid: string): Promise<RepositoryStatistics | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM repository_statistics WHERE uuid = ? LIMIT 1`,
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return RepositoryStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      total_repositories: row.total_repositories,
      active_repositories: row.active_repositories,
      archived_repositories: row.archived_repositories,
      total_resources: row.total_resources,
      total_folders: row.total_folders,
      total_tags: row.total_tags,
      total_storage_bytes: row.total_storage_bytes,
      last_updated_at: row.last_updatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]> {
    if (accountUuids.length === 0) return [];

    const placeholders = accountUuids.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM repository_statistics WHERE accountUuid IN (${placeholders}) ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(...accountUuids) as any[];

    return rows.map((row) =>
      RepositoryStatistics.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        total_repositories: row.total_repositories,
        active_repositories: row.active_repositories,
        archived_repositories: row.archived_repositories,
        total_resources: row.total_resources,
        total_folders: row.total_folders,
        total_tags: row.total_tags,
        total_storage_bytes: row.total_storage_bytes,
        last_updated_at: row.last_updatedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]> {
    let query = `SELECT * FROM repository_statistics ORDER BY createdAt DESC`;

    if (options?.skip) {
      query += ` OFFSET ${options.skip}`;
    }
    if (options?.take) {
      query += ` LIMIT ${options.take}`;
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all() as any[];

    return rows.map((row) =>
      RepositoryStatistics.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        total_repositories: row.total_repositories,
        active_repositories: row.active_repositories,
        archived_repositories: row.archived_repositories,
        total_resources: row.total_resources,
        total_folders: row.total_folders,
        total_tags: row.total_tags,
        total_storage_bytes: row.total_storage_bytes,
        last_updated_at: row.last_updatedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async count(): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM repository_statistics`);
    const result = stmt.get() as any;
    return result.count || 0;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM repository_statistics WHERE uuid = ?`);
    stmt.run(uuid);
  }
}

