import type { AIProviderConfigServerDTO } from '@memoflow/contracts/ai';
import type { IdentityId } from '@memoflow/contracts';
import type { AiProviderConfigId } from '@memoflow/contracts/primitives';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../server/domain';
import {
  createAIModule,
  type AIModuleDependencies,
  type AIModuleInstance,
} from '../server/infrastructure';

export function createAIConversationRepositoryStub(
  overrides: Partial<IAIConversationRepository> = {},
): IAIConversationRepository {
  return {
    save: async () => {},
    findByIdForIdentity: async () => null,
    findByIdentityId: async () => [],
    delete: async () => {},
    ...overrides,
  };
}

export function createAIProviderConfigRepositoryStub(
  overrides: Partial<IAIProviderConfigRepository> = {},
): IAIProviderConfigRepository {
  return {
    save: async () => 'SAVED',
    findByIdForIdentity: async () => null,
    findByIdentityId: async () => [],
    findDefaultByIdentityId: async () => null,
    delete: async () => {},
    setDefaultForIdentity: async () => 'NOT_FOUND',
    ...overrides,
  };
}

export function createAIProviderConfigServerDTO(
  overrides: Partial<AIProviderConfigServerDTO> = {},
): AIProviderConfigServerDTO {
  return {
    id: 'provider-1' as AiProviderConfigId,
    identityId: 'identity-1' as IdentityId,
    name: 'Main provider',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'plain-secret',
    defaultModel: 'gpt-4o-mini',
    isActive: true,
    isDefault: true,
    priority: 100,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    ...overrides,
  };
}

export function createAIModuleForTests(
  overrides: Partial<AIModuleDependencies> = {},
): AIModuleInstance {
  return createAIModule({
    conversationRepository: createAIConversationRepositoryStub(),
    providerConfigRepository: createAIProviderConfigRepositoryStub(),
    ...overrides,
  });
}
