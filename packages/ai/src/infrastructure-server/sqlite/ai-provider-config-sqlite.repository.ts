/**
 * SQLite AIProviderConfig Repository Implementation
 * AI 鏈嶅姟鍟嗛厤缃�?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import type { IAIProviderConfigRepository, AIProviderConfigServerDTO } from '@/domain-server';

export class SqliteAIProviderConfigRepository implements IAIProviderConfigRepository {
  constructor(private db: Database.Database) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_provider_configs (
        uuid, accountUuid, provider_name, api_key, is_default, is_active,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        provider_name = excluded.provider_name,
        api_key = excluded.api_key,
        is_default = excluded.is_default,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      config.uuid,
      config.accountUuid,
      config.provider_name,
      config.api_key,
      config.is_default ? 1 : 0,
      config.is_active ? 1 : 0,
      new Date(config.createdAt).getTime(),
      new Date(config.updatedAt).getTime(),
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
      `SELECT * FROM ai_provider_configs WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findDefaultByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE accountUuid = ? AND is_default = 1 LIMIT 1`
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
      `SELECT * FROM ai_provider_configs WHERE accountUuid = ? AND provider_name = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, name) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_provider_configs WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ai_provider_configs WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }

  async clearDefaultForAccount(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`UPDATE ai_provider_configs SET is_default = 0 WHERE accountUuid = ?`);
    stmt.run(accountUuid);
  }

  private rowToDTO(row: any): AIProviderConfigServerDTO {
    return {
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      provider_name: row.provider_name,
      api_key: row.api_key,
      is_default: row.is_default === 1,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

