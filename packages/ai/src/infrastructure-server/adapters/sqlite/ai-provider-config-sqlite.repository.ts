/**
 * SQLite AIProviderConfig Repository Implementation
 */

import type Database from 'better-sqlite3';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import { AiProviderConfigSqliteMapper } from './mappers/ai-provider-config-sqlite.mapper';

export class SqliteAIProviderConfigRepository implements IAIProviderConfigRepository {
  constructor(private db: Database.Database) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_provider_configs (
        id, identity_id, name, provider_type, base_url, api_key_encrypted,
        default_model, available_models, is_active, is_default, priority,
        version, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        provider_type = excluded.provider_type,
        base_url = excluded.base_url,
        api_key_encrypted = excluded.api_key_encrypted,
        default_model = excluded.default_model,
        available_models = excluded.available_models,
        is_active = excluded.is_active,
        is_default = excluded.is_default,
        priority = excluded.priority,
        version = excluded.version,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    stmt.run(
      String(config.id),
      String(config.identityId),
      config.name,
      config.providerType,
      config.baseUrl,
      config.apiKey,
      config.defaultModel,
      JSON.stringify(config.availableModels ?? []),
      config.isActive ? 1 : 0,
      config.isDefault ? 1 : 0,
      config.priority,
      config.version,
      config.createdAt,
      config.updatedAt,
      config.deletedAt,
    );
  }

  async findById(id: string): Promise<AIProviderConfigServerDTO | null> {
    const row = this.db
      .prepare(
        `
        SELECT * FROM ai_provider_configs
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(id) as any;

    return row ? AiProviderConfigSqliteMapper.toDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    const rows = this.db
      .prepare(
        `
        SELECT * FROM ai_provider_configs
        WHERE identity_id = ? AND deleted_at IS NULL
        ORDER BY priority ASC, created_at ASC
      `,
      )
      .all(identityId) as any[];

    return rows.map((row) => AiProviderConfigSqliteMapper.toDTO(row));
  }

  async findDefaultByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    const row = this.db
      .prepare(
        `
        SELECT * FROM ai_provider_configs
        WHERE identity_id = ? AND is_default = 1 AND is_active = 1 AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(identityId) as any;

    return row ? AiProviderConfigSqliteMapper.toDTO(row) : null;
  }

  async findByIdentityIdAndName(
    identityId: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const row = this.db
      .prepare(
        `
        SELECT * FROM ai_provider_configs
        WHERE identity_id = ? AND name = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(identityId, name) as any;

    return row ? AiProviderConfigSqliteMapper.toDTO(row) : null;
  }

  async delete(id: string): Promise<void> {
    this.db
      .prepare(
        `
        UPDATE ai_provider_configs
        SET is_default = 0, deleted_at = ?, updated_at = ?
        WHERE id = ?
      `,
      )
      .run(Date.now(), Date.now(), id);
  }

  async exists(id: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM ai_provider_configs WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
      .get(id);
    return row !== undefined;
  }

  async clearDefaultForIdentity(identityId: string): Promise<void> {
    this.db
      .prepare(
        `
        UPDATE ai_provider_configs
        SET is_default = 0, updated_at = ?
        WHERE identity_id = ? AND deleted_at IS NULL
      `,
      )
      .run(Date.now(), identityId);
  }
}
