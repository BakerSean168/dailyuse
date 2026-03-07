/**
 * SQLite Repository Repository Implementation
 * Repository 聚合根的 SQLite Repository实现
 */

import type Database from 'better-sqlite3';
import { Repository } from '../../../domain-server/aggregates/repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import { RepositorySqliteMapper } from './mappers/repository-sqlite.mapper';

export class SqliteRepositoryRepository implements IRepositoryRepository {
  constructor(private db: Database.Database) {}

  async save(repository: Repository): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO repositories (
        id, identity_id, name, description, type, status, config,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        type = excluded.type,
        status = excluded.status,
        config = excluded.config,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      String(repository.id),
      String(repository.identityId),
      repository.name,
      repository.description || null,
      repository.type,
      repository.status,
      JSON.stringify(repository.config),
      repository.createdAt.getTime(),
      repository.updatedAt.getTime(),
    );
  }

  async findById(id: string): Promise<Repository | null> {
    const stmt = this.db.prepare(`SELECT * FROM repositories WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return RepositorySqliteMapper.toDomain(row);
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE identity_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => RepositorySqliteMapper.toDomain(row));
  }

  async findByAccountId(identityId: string): Promise<Repository[]> {
    return this.findByIdentityId(identityId);
  }

  async findByIdentityIdAndStatus(
    identityId: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM repositories WHERE identity_id = ? AND status = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) => RepositorySqliteMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM repositories WHERE id = ?`);
    stmt.run(id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM repositories WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }
}
