import {
  AIProviderType,
  type AIProviderConfigClientDTO,
  type AIProviderConfigServerDTO,
  type TestAIProviderReq,
} from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import { toChatExecutionProviderConfig } from './ai-provider-resolution';

export function toClientDTO(provider: AIProviderConfigServerDTO): AIProviderConfigClientDTO {
  const plainApiKey = provider.apiKey;

  return {
    id: provider.id,
    identityId: provider.identityId,
    name: provider.name,
    providerType: provider.providerType,
    baseUrl: provider.baseUrl,
    apiKeyMasked:
      plainApiKey.length > 8 ? `${plainApiKey.slice(0, 3)}****${plainApiKey.slice(-4)}` : '****',
    defaultModel: provider.defaultModel,
    availableModels: provider.availableModels,
    isActive: provider.isActive,
    isDefault: provider.isDefault,
    priority: provider.priority,
    version: provider.version,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
    deletedAt: provider.deletedAt,
  };
}

export async function resolveProviderConfigForConnectionTest(
  providerConfigRepository: IAIProviderConfigRepository,
  identityId: string,
  request: TestAIProviderReq,
) {
  if (request.providerId) {
    const provider = await providerConfigRepository.findByIdForIdentity(
      identityId,
      request.providerId,
    );
    if (!provider) {
      throw new Error('Provider not found');
    }

    return toChatExecutionProviderConfig(provider, {
      temperature: 0.2,
    });
  }

  if (!request.baseUrl || !request.apiKey || !request.model) {
    throw new Error('Provider config is incomplete');
  }

  return toChatExecutionProviderConfig(
    {
      providerType: AIProviderType.OpenAICompatible,
      baseUrl: request.baseUrl,
      apiKey: request.apiKey,
      defaultModel: request.model,
    },
    {
      temperature: 0.2,
    },
  );
}
