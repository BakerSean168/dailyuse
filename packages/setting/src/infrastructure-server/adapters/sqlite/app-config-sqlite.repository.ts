/**
 * SQLite AppConfig Repository Implementation
 * 搴旂敤閰嶇疆鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { AppConfig } from '@/domain-server/aggregates/app-config';
import type { IAppConfigRepository } from '@/domain-server/repositories/IAppConfigRepository';

export class SqliteAppConfigRepository implements IAppConfigRepository {
  constructor(private db: Database.Database) {}

  async save(config: AppConfig): Promise<void> {
    const dto = config.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO app_configs (
        id, key, value, description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        description = excluded.description,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.key,
      JSON.stringify(dto.value),
      dto.description || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<AppConfig | null> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return AppConfig.fromPersistenceDTO({
      id: row.id,
      key: row.key,
      value: JSON.parse(row.value),
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByKey(key: string): Promise<AppConfig | null> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs WHERE key = ? LIMIT 1`);
    const row = stmt.get(key) as any;

    if (!row) return null;

    return AppConfig.fromPersistenceDTO({
      id: row.id,
      key: row.key,
      value: JSON.parse(row.value),
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findAll(): Promise<AppConfig[]> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs ORDER BY key ASC`);
    const rows = stmt.all() as any[];

    return rows.map((row) =>
      AppConfig.fromPersistenceDTO({
        id: row.id,
        key: row.key,
        value: JSON.parse(row.value),
        description: row.description,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM app_configs WHERE id = ?`);
    stmt.run(id);
  }

  async deleteByKey(key: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM app_configs WHERE key = ?`);
    stmt.run(key);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM app_configs WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }
}

