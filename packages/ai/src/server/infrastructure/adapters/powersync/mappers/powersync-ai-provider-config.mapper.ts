import type {
  AIProviderConfigServerDTO,
  AIProviderType,
} from '@memoflow/contracts/ai';
import type { IAIProviderSecretVault } from '../../../../application/ports/provider-secret-vault.port';

export interface PowerSyncAIProviderConfigRow {
  id: string;
  identity_id: string;
  name: string;
  provider_type: string;
  base_url: string;
  api_key_encrypted: string;
  default_model: string | null;
  available_models: string | null;
  is_active: number | null;
  is_default: number | null;
  priority: number | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PowerSyncAIProviderConfigWriteRow {
  id: string;
  identity_id: string;
  name: string;
  provider_type: string;
  base_url: string;
  api_key_encrypted: string;
  default_model: string | null;
  is_active: number;
  is_default: number;
  priority: number;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}


export class PowerSyncAIProviderConfigMapper {
  static toDTO(
    row: PowerSyncAIProviderConfigRow,
    secretCipher: IAIProviderSecretVault,
  ): AIProviderConfigServerDTO {
    const createdAt = new Date(row.created_at).getTime();
    const updatedAt = new Date(row.updated_at).getTime();
    const deletedAt = row.deleted_at ? new Date(row.deleted_at).getTime() : null;

    return {
      id: row.id as AIProviderConfigServerDTO['id'],
      identityId: row.identity_id as AIProviderConfigServerDTO['identityId'],
      name: row.name,
      providerType: row.provider_type as AIProviderType,
      baseUrl: row.base_url,
      apiKey: secretCipher.decrypt(row.api_key_encrypted),
      defaultModel: row.default_model,
      isActive: row.is_active === 1,
      isDefault: row.is_default === 1,
      priority: row.priority ?? 100,
      version: row.version ?? 1,
      createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
      updatedAt: Number.isNaN(updatedAt) ? Date.now() : updatedAt,
      deletedAt,
    };
  }

  static toPersistence(
    config: AIProviderConfigServerDTO,
    secretCipher: IAIProviderSecretVault,
  ): PowerSyncAIProviderConfigWriteRow {
    return {
      id: String(config.id),
      identity_id: String(config.identityId),
      name: config.name,
      provider_type: config.providerType,
      base_url: config.baseUrl,
      api_key_encrypted: secretCipher.encrypt(secretCipher.decrypt(config.apiKey)),
      default_model: config.defaultModel,
      is_active: config.isActive ? 1 : 0,
      is_default: config.isDefault ? 1 : 0,
      priority: config.priority,
      version: config.version,
      created_at: new Date(config.createdAt).toISOString(),
      updated_at: new Date(config.updatedAt).toISOString(),
      deleted_at: config.deletedAt ? new Date(config.deletedAt).toISOString() : null,
    };
  }
}
