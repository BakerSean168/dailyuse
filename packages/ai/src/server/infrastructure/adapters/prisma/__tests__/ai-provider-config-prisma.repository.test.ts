import { describe, expect, it, vi } from 'vitest';

import { AIProviderType, type AIProviderConfigServerDTO } from '@memoflow/contracts/ai';
import type { PrismaClient } from '@memoflow/database';

import { AIProviderConfigPrismaRepository } from '../ai-provider-config-prisma.repository';
import { AISecretCipher } from '../../../security/ai-secret-cipher';

describe('AIProviderConfigPrismaRepository', () => {
  it('decrypts api keys when reading and stores encrypted values when writing', async () => {
    const cipher = new AISecretCipher('test-secret');
    const aiProviderConfig = {
      findUnique: vi.fn(async () => ({ identityId: 'identity-1' })),
      updateMany: vi.fn(async () => ({ count: 1 })),
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
    };
    const transactionClient = {
      aiProviderConfig,
      $queryRawUnsafe: vi.fn(async () => [{ acquired: true }]),
    };
    const prisma = {
      aiProviderConfig,
      $transaction: vi.fn(async (callback) => callback(transactionClient)),
    };

    const repository = new AIProviderConfigPrismaRepository(
      prisma as unknown as PrismaClient,
      cipher,
    );

    const provider = await repository.findByIdForIdentity('identity-1', 'provider-1');

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
      const aiProviderConfig = {
        count: vi.fn(async () => 0),
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        updateMany: vi.fn(async () => ({ count: 1 })),
        upsert: vi.fn(async () => undefined),
      };
      const transactionClient = {
        aiProviderConfig,
        $queryRawUnsafe: vi.fn(async () => [{ acquired: true }]),
      };
      const prisma = {
        aiProviderConfig,
        $transaction: vi.fn(async (callback) => callback(transactionClient)),
      };
      // No cipher injected and no env key: construction must NOT throw (lazy),
      // and operations that never touch encrypted fields must work.
      const repository = new AIProviderConfigPrismaRepository(prisma as unknown as PrismaClient);
      await expect(repository.findByIdForIdentity('identity-1', 'provider-1')).resolves.toBeNull();

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

  it('selects a default through one transaction and never clears it for an unavailable provider', async () => {
    const cipher = new AISecretCipher('test-secret');
    const aiProviderConfig = {
      findFirst: vi.fn(async () => ({ id: 'provider-2' })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    };
    const transactionClient = {
      aiProviderConfig,
      $queryRawUnsafe: vi.fn(async () => [{ acquired: true }]),
    };
    const prisma = {
      aiProviderConfig,
      $transaction: vi.fn(async (callback) => callback(transactionClient)),
    };
    const repository = new AIProviderConfigPrismaRepository(
      prisma as unknown as PrismaClient,
      cipher,
    );

    await expect(repository.setDefaultForIdentity('identity-1', 'provider-2')).resolves.toBe('SET');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(aiProviderConfig.updateMany).toHaveBeenCalledTimes(2);
    expect(aiProviderConfig.updateMany.mock.calls[0]?.[0]).toMatchObject({
      where: { identityId: 'identity-1', id: { not: 'provider-2' } },
    });

    aiProviderConfig.findFirst.mockResolvedValueOnce(null);
    await expect(repository.setDefaultForIdentity('identity-1', 'missing')).resolves.toBe(
      'NOT_FOUND',
    );
    expect(aiProviderConfig.updateMany).toHaveBeenCalledTimes(2);
  });

  it('uses a blocking identity lock so competing selections serialize instead of failing', async () => {
    const cipher = new AISecretCipher('test-secret');
    const aiProviderConfig = {
      findFirst: vi.fn(async () => ({ id: 'provider-2' })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    };
    const transactionClient = {
      aiProviderConfig,
      $queryRawUnsafe: vi.fn(async () => [{}]),
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(transactionClient)),
    };
    const repository = new AIProviderConfigPrismaRepository(
      prisma as unknown as PrismaClient,
      cipher,
    );

    await expect(repository.setDefaultForIdentity('identity-1', 'provider-2')).resolves.toBe('SET');
    expect(transactionClient.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      'identity-1',
    );
    expect(aiProviderConfig.findFirst).toHaveBeenCalledOnce();
    expect(aiProviderConfig.updateMany).toHaveBeenCalledTimes(2);
  });

  it('rolls back clearing the old default when selecting the new default fails', async () => {
    const cipher = new AISecretCipher('test-secret');
    const persisted = { provider1: true, provider2: false };
    const prisma = {
      $transaction: vi.fn(async (callback) => {
        const working = { ...persisted };
        let updateCount = 0;
        const tx = {
          $queryRawUnsafe: vi.fn(async () => [{ acquired: true }]),
          aiProviderConfig: {
            findFirst: vi.fn(async () => ({ id: 'provider-2' })),
            updateMany: vi.fn(async () => {
              updateCount += 1;
              if (updateCount === 1) {
                working.provider1 = false;
                return { count: 1 };
              }
              throw new Error('injected write failure');
            }),
          },
        };
        const result = await callback(tx);
        Object.assign(persisted, working);
        return result;
      }),
    };
    const repository = new AIProviderConfigPrismaRepository(
      prisma as unknown as PrismaClient,
      cipher,
    );

    await expect(repository.setDefaultForIdentity('identity-1', 'provider-2')).rejects.toThrow(
      'injected write failure',
    );
    expect(persisted).toEqual({ provider1: true, provider2: false });
  });
});
