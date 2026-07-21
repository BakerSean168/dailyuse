import { describe, expect, it } from 'vitest';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import { AIProviderConfigMemoryRepository } from '../ai-provider-config-memory.repository';

function provider(
  overrides: Partial<AIProviderConfigServerDTO> = {},
): AIProviderConfigServerDTO {
  return {
    id: 'provider-1' as AIProviderConfigServerDTO['id'],
    identityId: 'identity-1' as AIProviderConfigServerDTO['identityId'],
    name: 'Main',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'secret',
    defaultModel: 'gpt-4o-mini',
    availableModels: [],
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

describe('AIProviderConfigMemoryRepository ownership', () => {
  it('returns null for foreign identity reads and refuses cross-identity save/delete', async () => {
    const repo = new AIProviderConfigMemoryRepository();
    await repo.save(provider());

    await expect(repo.findByIdForIdentity('identity-other', 'provider-1')).resolves.toBeNull();
    await expect(repo.findByIdForIdentity('identity-1', 'provider-1')).resolves.toMatchObject({
      name: 'Main',
    });

    await expect(
      repo.save(provider({ identityId: 'identity-other' as AIProviderConfigServerDTO['identityId'] })),
    ).rejects.toThrow(/current identity/);
    await expect(repo.delete('identity-other', 'provider-1')).rejects.toThrow(/current identity/);
    await expect(repo.delete('identity-1', 'provider-1')).resolves.toBeUndefined();
    await expect(repo.findById('provider-1')).resolves.toBeNull();
  });
});
