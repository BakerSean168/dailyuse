import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import { AISecretCipher } from '../../security/ai-secret-cipher';
import { PowerSyncAIProviderConfigMapper, type PowerSyncAIProviderConfigRow } from './mappers';

export class PowerSyncAIProviderConfigRepository implements IAIProviderConfigRepository {
  constructor(
    private readonly db: IElectronDatabase,
    private readonly secretCipher = new AISecretCipher(),
  ) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const d = PowerSyncAIProviderConfigMapper.toPersistence(config, this.secretCipher);
    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM ai_provider_configs WHERE id = ? LIMIT 1`,
      [d.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE ai_provider_configs
         SET identity_id = ?,
             name = ?,
             provider_type = ?,
             base_url = ?,
             api_key_encrypted = ?,
             default_model = ?,
             available_models = ?,
             is_active = ?,
             is_default = ?,
             priority = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          d.identity_id,
          d.name,
          d.provider_type,
          d.base_url,
          d.api_key_encrypted,
          d.default_model,
          d.available_models,
          d.is_active,
          d.is_default,
          d.priority,
          d.version,
          d.updated_at,
          d.deleted_at,
          d.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO ai_provider_configs (
           id, identity_id, name, provider_type, base_url, api_key_encrypted,
           default_model, available_models, is_active, is_default, priority,
           version, created_at, updated_at, deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id,
          d.identity_id,
          d.name,
          d.provider_type,
          d.base_url,
          d.api_key_encrypted,
          d.default_model,
          d.available_models,
          d.is_active,
          d.is_default,
          d.priority,
          d.version,
          d.created_at,
          d.updated_at,
          d.deleted_at,
        ],
      );
    }
  }

  async findById(id: string): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncAIProviderConfigRow>(
      `SELECT * FROM ai_provider_configs WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return row ? PowerSyncAIProviderConfigMapper.toDTO(row, this.secretCipher) : null;
  }

  async findByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    const rows = await this.db.getAll<PowerSyncAIProviderConfigRow>(
      `SELECT * FROM ai_provider_configs
       WHERE identity_id = ? AND deleted_at IS NULL
       ORDER BY priority ASC, created_at ASC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncAIProviderConfigMapper.toDTO(row, this.secretCipher));
  }

  async findDefaultByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncAIProviderConfigRow>(
      `SELECT * FROM ai_provider_configs
       WHERE identity_id = ? AND is_default = 1 AND is_active = 1 AND deleted_at IS NULL
       LIMIT 1`,
      [identityId],
    );
    return row ? PowerSyncAIProviderConfigMapper.toDTO(row, this.secretCipher) : null;
  }

  async findByIdentityIdAndName(
    identityId: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncAIProviderConfigRow>(
      `SELECT * FROM ai_provider_configs
       WHERE identity_id = ? AND name = ? AND deleted_at IS NULL
       LIMIT 1`,
      [identityId, name],
    );
    return row ? PowerSyncAIProviderConfigMapper.toDTO(row, this.secretCipher) : null;
  }

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE ai_provider_configs SET is_default = 0, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id],
    );
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ one: number }>(
      `SELECT 1 as one FROM ai_provider_configs WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return row !== null;
  }

  async clearDefaultForIdentity(identityId: string): Promise<void> {
    await this.db.execute(
      `UPDATE ai_provider_configs SET is_default = 0, updated_at = ?
       WHERE identity_id = ? AND deleted_at IS NULL`,
      [new Date().toISOString(), identityId],
    );
  }
}
