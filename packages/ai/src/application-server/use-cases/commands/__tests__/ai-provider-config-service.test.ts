import { describe, expect, it, vi } from 'vitest';

import { AIProviderType, type TestAIProviderReq } from '@dailyuse/contracts/ai';

import type {
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  IAIChatExecutionPort,
} from '../../../ports';
import type { IAIProviderConfigRepository } from '../../../../domain-server/repositories/IAIProviderConfigRepository';
import { TestAIProviderConnectionUseCase } from '../test-ai-provider-connection.use-case';

class StubProviderConfigRepository {
  constructor(
    private readonly provider: {
      id: string;
      identityId: string;
      name: string;
      providerType: string;
      baseUrl: string;
      apiKey: string;
      defaultModel: string | null;
      availableModels: [];
      isActive: boolean;
      isDefault: boolean;
      priority: number;
      version: number;
      createdAt: number;
      updatedAt: number;
      deletedAt: null;
    },
  ) {}

  async findById(id: string) {
    return id === this.provider.id ? this.provider : null;
  }

  async findByIdentityId() {
    return [this.provider];
  }

  async findDefaultByIdentityId() {
    return this.provider;
  }

  async save(): Promise<void> {}
  async delete(): Promise<void> {}
  async clearDefaultForIdentity(): Promise<void> {}
}

class StubChatExecutionPort implements IAIChatExecutionPort {
  public readonly complete = vi.fn<
    (input: ChatExecutionCompleteInput) => Promise<ChatExecutionCompleteResult>
  >(async () => ({
    content: 'Provider connection ok',
    finishReason: 'stop',
    usage: {
      promptTokens: 5,
      completionTokens: 3,
      totalTokens: 8,
    },
  }));
}

describe('TestAIProviderConnectionUseCase', () => {
  it('tests a saved provider through the shared execution port', async () => {
    const executionPort = new StubChatExecutionPort();
    const useCase = new TestAIProviderConnectionUseCase(
      new StubProviderConfigRepository({
        id: 'provider-1',
        identityId: 'identity-1',
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
      }) as unknown as IAIProviderConfigRepository,
      executionPort,
    );

    const result = await useCase.execute('identity-1', {
      providerId: 'provider-1' as TestAIProviderReq['providerId'],
    });

    expect(executionPort.complete).toHaveBeenCalledWith({
      identityId: 'identity-1',
      providerConfig: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: 'plain-secret',
        baseUrl: 'https://api.openai.com/v1',
        temperature: 0.2,
        maxTokens: undefined,
      },
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        ok: true,
        response: 'Provider connection ok',
        model: 'gpt-4o-mini',
        latencyMs: expect.any(Number),
      });
    }
  });

  it('returns error result for provider owned by another identity', async () => {
    const useCase = new TestAIProviderConnectionUseCase(
      new StubProviderConfigRepository({
        id: 'provider-1',
        identityId: 'someone-else',
        name: 'Foreign provider',
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
      }) as unknown as IAIProviderConfigRepository,
      new StubChatExecutionPort(),
    );

    const result = await useCase.execute('identity-1', {
      providerId: 'provider-1' as TestAIProviderReq['providerId'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ok).toBe(false);
      expect(result.data.error).toBe('Provider not found');
    }
  });
});
