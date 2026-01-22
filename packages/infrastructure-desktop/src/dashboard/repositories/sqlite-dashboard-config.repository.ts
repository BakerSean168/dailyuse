/**
 * SQLite DashboardConfig Repository Implementation
 * 仪表板配置的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';

export class SqliteDashboardConfigRepository implements IDashboardConfigRepository {
  constructor(private db: Database.Database) {}

  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM dashboard_configs WHERE account_uuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return DashboardConfig.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      config: row.config ? JSON.parse(row.config) : {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async save(config: DashboardConfig): Promise<DashboardConfig> {
    const dto = config.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO dashboard_configs (
        uuid, account_uuid, config, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        config = excluded.config,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      JSON.stringify(dto.config || {}),
      dto.created_at,
      dto.updated_at,
    );

    return config;
  }

  async delete(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM dashboard_configs WHERE account_uuid = ?`);
    stmt.run(accountUuid);
  }

  async exists(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM dashboard_configs WHERE account_uuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }
}
