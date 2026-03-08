import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

export class AiProviderConfigSqliteMapper {
  static toDTO(row: any): AIProviderConfigServerDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      providerType: row.provider_type,
      baseUrl: row.base_url,
      apiKey: row.api_key_encrypted,
      defaultModel: row.default_model,
      availableModels: this.parseModels(row.available_models),
      isActive: row.is_active === 1,
      isDefault: row.is_default === 1,
      priority: row.priority ?? 100,
      version: row.version ?? 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  private static parseModels(value: string | null): any[] {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
