/**
 * SQLite Repository Repository Implementation
 * Repository 聚合根的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { Repository } from '@dailyuse/domain-server/repository';
import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';

export class SqliteRepositoryRepository implements IRepositoryRepository {
  constructor(private db: Database.Database) {}

  async save(repository: Repository): Promise<void> {
    const dto = repository.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO repositories (
        uuid, account_uuid, name, description, type, status, config,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        type = excluded.type,
        status = excluded.status,
        config = excluded.config,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.name,
      dto.description || null,
      dto.type,
      dto.status,
      dto.config ? JSON.stringify(dto.config) : null,
      dto.created_at,
      dto.updated_at,
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
      account_uuid: row.account_uuid,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      config: row.config ? JSON.parse(row.config) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE account_uuid = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Repository.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        description: row.description,
        type: row.type,
        status: row.status,
        config: row.config ? JSON.parse(row.config) : undefined,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      }),
    );
  }

  async findByAccountUuidAndStatus(
    accountUuid: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE account_uuid = ? AND status = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) =>
      Repository.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        description: row.description,
        type: row.type,
        status: row.status,
        config: row.config ? JSON.parse(row.config) : undefined,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
