/**
 * SQLite DashboardConfig Repository Implementation
 * 浠〃鏉块厤缃殑 SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';

export class SqliteDashboardConfigRepository implements IDashboardConfigRepository {
  constructor(private db: Database.Database) {}

  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM dashboard_configs WHERE accountUuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return DashboardConfig.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      config: row.config ? JSON.parse(row.config) : {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async save(config: DashboardConfig): Promise<DashboardConfig> {
    const dto = config.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO dashboard_configs (
        uuid, accountUuid, config, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(accountUuid) DO UPDATE SET
        config = excluded.config,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      JSON.stringify(dto.config || {}),
      dto.createdAt,
      dto.updatedAt,
    );

    return config;
  }

  async delete(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM dashboard_configs WHERE accountUuid = ?`);
    stmt.run(accountUuid);
  }

  async exists(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM dashboard_configs WHERE accountUuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }
}

