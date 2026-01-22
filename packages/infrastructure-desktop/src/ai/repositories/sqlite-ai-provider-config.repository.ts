/**
 * SQLite AIProviderConfig Repository Implementation
 * AI 服务商配置的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import type { IAIProviderConfigRepository, AIProviderConfigServerDTO } from '@dailyuse/domain-server/ai';

export class SqliteAIProviderConfigRepository implements IAIProviderConfigRepository {
  constructor(private db: Database.Database) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_provider_configs (
        uuid, account_uuid, provider_name, api_key, is_default, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        provider_name = excluded.provider_name,
        api_key = excluded.api_key,
        is_default = excluded.is_default,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      config.uuid,
      config.account_uuid,
      config.provider_name,
      config.api_key,
      config.is_default ? 1 : 0,
      config.is_active ? 1 : 0,
      new Date(config.created_at).getTime(),
      new Date(config.updated_at).getTime(),
    );
  }

  async findByUuid(uuid: string): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE uuid = ? LIMIT 1`
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findDefaultByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE account_uuid = ? AND is_default = 1 LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountUuidAndName(
    accountUuid: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE account_uuid = ? AND provider_name = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, name) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_provider_configs WHERE uuid = ?`);
    stmt.run(uuid);
  }

  private rowToDTO(row: any): AIProviderConfigServerDTO {
    return {
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      provider_name: row.provider_name,
      api_key: row.api_key,
      is_default: row.is_default === 1,
      is_active: row.is_active === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
