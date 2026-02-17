/**
 * SQLite AppConfig Repository Implementation
 * AppConfig 的 SQLite 仓储实现
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
        id, version, app, features, limits, api, security, notifications, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        version = excluded.version,
        app = excluded.app,
        features = excluded.features,
        limits = excluded.limits,
        api = excluded.api,
        security = excluded.security,
        notifications = excluded.notifications,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.version,
      dto.app,
      dto.features,
      dto.limits,
      dto.api,
      dto.security,
      dto.notifications,
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
      version: row.version,
      app: row.app,
      features: row.features,
      limits: row.limits,
      api: row.api,
      security: row.security,
      notifications: row.notifications,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async getCurrent(): Promise<AppConfig | null> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs ORDER BY updatedAt DESC LIMIT 1`);
    const row = stmt.get() as any;
    if (!row) return null;

    return AppConfig.fromPersistenceDTO({
      id: row.id,
      version: row.version,
      app: row.app,
      features: row.features,
      limits: row.limits,
      api: row.api,
      security: row.security,
      notifications: row.notifications,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByVersion(version: string): Promise<AppConfig | null> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs WHERE version = ? LIMIT 1`);
    const row = stmt.get(version) as any;
    if (!row) return null;

    return AppConfig.fromPersistenceDTO({
      id: row.id,
      version: row.version,
      app: row.app,
      features: row.features,
      limits: row.limits,
      api: row.api,
      security: row.security,
      notifications: row.notifications,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findAllVersions(): Promise<AppConfig[]> {
    const stmt = this.db.prepare(`SELECT * FROM app_configs ORDER BY createdAt DESC`);
    const rows = stmt.all() as any[];

    return rows.map((row) =>
      AppConfig.fromPersistenceDTO({
        id: row.id,
        version: row.version,
        app: row.app,
        features: row.features,
        limits: row.limits,
        api: row.api,
        security: row.security,
        notifications: row.notifications,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM app_configs WHERE id = ?`);
    stmt.run(id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM app_configs WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  async existsByVersion(version: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM app_configs WHERE version = ? LIMIT 1`);
    return stmt.get(version) !== undefined;
  }
}

