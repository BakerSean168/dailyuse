/**
 * SQLite AIProviderConfig Repository Implementation
 * AI 鏈嶅姟鍟嗛厤缃�?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import type { IAIProviderConfigRepository, AIProviderConfigServerDTO } from '../../domain-server/repositories/IAIProviderConfigRepository';

export class SqliteAIProviderConfigRepository implements IAIProviderConfigRepository {
  constructor(private db: Database.Database) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_provider_configs (
        id, identityId, provider_name, api_key, is_default, is_active,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        provider_name = excluded.provider_name,
        api_key = excluded.api_key,
        is_default = excluded.is_default,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      config.id,
      config.identityId,
      config.provider_name,
      config.api_key,
      config.is_default ? 1 : 0,
      config.is_active ? 1 : 0,
      new Date(config.createdAt).getTime(),
      new Date(config.updatedAt).getTime(),
    );
  }

  async findById(id: string): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE id = ? LIMIT 1`
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountId(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE identityId = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findDefaultByAccountId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE identityId = ? AND is_default = 1 LIMIT 1`
    );
    const row = stmt.get(identityId) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByIdentityIdAndName(
    identityId: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_provider_configs WHERE identityId = ? AND provider_name = ? LIMIT 1`
    );
    const row = stmt.get(identityId, name) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_provider_configs WHERE id = ?`);
    stmt.run(id);
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ai_provider_configs WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  async clearDefaultForAccount(identityId: string): Promise<void> {
    const stmt = this.db.prepare(`UPDATE ai_provider_configs SET is_default = 0 WHERE identityId = ?`);
    stmt.run(identityId);
  }

  private rowToDTO(row: any): AIProviderConfigServerDTO {
    return {
      id: row.id,
      identity_id: row.identityId,
      provider_name: row.provider_name,
      api_key: row.api_key,
      is_default: row.is_default === 1,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

