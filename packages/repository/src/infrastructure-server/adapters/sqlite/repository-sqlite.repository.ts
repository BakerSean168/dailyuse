/**
 * SQLite Repository Repository Implementation
 * Repository 鑱氬悎鏍圭殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Repository } from '../../../domain-server/aggregates/repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';

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
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.description || null,
      dto.type,
      dto.status,
      dto.config ? JSON.stringify(dto.config) : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<Repository | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE uuid = ? LIMIT 1`,
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Repository.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      config: row.config ? JSON.parse(row.config) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE accountUuid = ? ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Repository.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        name: row.name,
        description: row.description,
        type: row.type,
        status: row.status,
        config: row.config ? JSON.parse(row.config) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }),
    );
  }

  async findByAccountUuidAndStatus(
    accountUuid: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE accountUuid = ? AND status = ? ORDER BY createdAt DESC`,
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) =>
      Repository.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        name: row.name,
        description: row.description,
        type: row.type,
        status: row.status,
        config: row.config ? JSON.parse(row.config) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }),
    );
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

