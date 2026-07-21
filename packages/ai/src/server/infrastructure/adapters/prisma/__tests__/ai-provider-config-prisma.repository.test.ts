import { describe, expect, it, vi } from 'vitest';

import { AIProviderType, type AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import type { PrismaClient } from '@dailyuse/database';

import { AIProviderConfigPrismaRepository } from '../ai-provider-config-prisma.repository';
import { AISecretCipher } from '../../../security/ai-secret-cipher';

describe('AIProviderConfigPrismaRepository', () => {
  it('decrypts api keys when reading and stores encrypted values when writing', async () => {
    const cipher = new AISecretCipher('test-secret');
    const prisma = {
      aiProviderConfig: {
        findUnique: vi.fn(async () => ({ identityId: 'identity-1' })),
        upsert: vi.fn(async () => undefined),
        findFirst: vi.fn(async () => ({
          id: 'provider-1',
          identityId: 'identity-1',
          name: 'Main provider',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKeyEncrypted: cipher.encrypt('plain-secret'),
          defaultModel: 'gpt-4o-mini',
          availableModels: '[]',
          isActive: true,
          isDefault: true,
          priority: 100,
          version: 1,
          createdAt: new Date('2026-03-26T00:00:00.000Z'),
          updatedAt: new Date('2026-03-26T00:00:00.000Z'),
          deletedAt: null,
        })),
      },
    };

    const repository = new AIProviderConfigPrismaRepository(prisma as unknown as PrismaClient, cipher);

    const provider = await repository.findById('provider-1');

    expect(provider?.apiKey).toBe('plain-secret');

    await repository.save({
      id: 'provider-1' as AIProviderConfigServerDTO['id'],
      identityId: 'identity-1' as AIProviderConfigServerDTO['identityId'],
      name: 'Main provider',
      providerType: AIProviderType.OpenAICompatible,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'plain-secret',
      defaultModel: 'gpt-4o-mini',
      availableModels: [],
      isActive: true,
      isDefault: true,
      priority: 100,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    expect(prisma.aiProviderConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          apiKeyEncrypted: expect.stringMatching(/^enc_v2:/),
        }),
        update: expect.objectContaining({
          apiKeyEncrypted: expect.stringMatching(/^enc_v2:/),
        }),
      }),
    );
  });

  it('constructs without a cipher/key and only fails fast when a secret is actually encrypted', async () => {
    const originalKey = process.env.AI_PROVIDER_ENCRYPTION_KEY;
    delete process.env.AI_PROVIDER_ENCRYPTION_KEY;
    try {
      const prisma = {
        aiProviderConfig: {
          count: vi.fn(async () => 0),
          findUnique: vi.fn(async () => null),
          findFirst: vi.fn(async () => null),
          upsert: vi.fn(async () => undefined),
        },
      };
      // No cipher injected and no env key: construction must NOT throw (lazy),
      // and operations that never touch encrypted fields must work.
      const repository = new AIProviderConfigPrismaRepository(prisma as unknown as PrismaClient);
      await expect(repository.findById('provider-1')).resolves.toBeNull();

      // Only when we actually persist a secret does the missing key fail fast.
      await expect(
        repository.save({
          id: 'provider-1' as AIProviderConfigServerDTO['id'],
          identityId: 'identity-1' as AIProviderConfigServerDTO['identityId'],
          name: 'Main provider',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          availableModels: [],
          isActive: true,
          isDefault: true,
          priority: 100,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null,
        }),
      ).rejects.toThrow(/AI_PROVIDER_ENCRYPTION_KEY/);
    } finally {
      if (originalKey === undefined) {
        delete process.env.AI_PROVIDER_ENCRYPTION_KEY;
      } else {
        process.env.AI_PROVIDER_ENCRYPTION_KEY = originalKey;
      }
    }
  });
});
