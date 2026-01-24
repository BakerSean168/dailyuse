/**
 * SQLite AppConfig Repository Implementation
 * 搴旂敤閰嶇疆鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { AppConfig } from '@dailyuse/domain-server/setting';
import type { IAppConfigRepository } from '@dailyuse/domain-server/setting';

export class SqliteAppConfigRepository implements IAppConfigRepository {
  constructor(private db: Database.Database) {}

  async save(config: AppConfig): Promise<void> {
    const dto = config.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO app_configs (
        uuid, key, value, description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        description = excluded.description,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.key,
      JSON.stringify(dto.value),
      dto.description || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<AppConfig | null> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return AppConfig.fromPersistenceDTO({
      uuid: row.uuid,
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
      uuid: row.uuid,
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
        uuid: row.uuid,
        key: row.key,
        value: JSON.parse(row.value),
        description: row.description,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM app_configs WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByKey(key: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM app_configs WHERE key = ?`);
    stmt.run(key);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM app_configs WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

