import { describe, expect, it, vi } from 'vitest';

import { AIConversation } from '../../../../domain-server/aggregates/ai-conversation';
import { AIProviderType } from '@dailyuse/contracts/ai';
import type { IAIConversationRepository } from '../../../../domain-server/repositories/IAIConversationRepository';
import type { IAIProviderConfigRepository } from '../../../../domain-server/repositories/IAIProviderConfigRepository';
import { SendAIMessageUseCase } from '../send-ai-message.use-case';
import { StreamAIMessageUseCase } from '../stream-ai-message.use-case';
import type {
  AIExecutionLogInput,
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  IAIExecutionLogPort,
  IAIChatExecutionPort,
} from '../../../ports';

class InMemoryConversationRepository {
  constructor(private conversation: AIConversation) {}

  async save(conversation: AIConversation): Promise<void> {
    this.conversation = conversation;
  }

  async findById(): Promise<AIConversation | null> {
    return this.conversation;
  }
}

class StubProviderConfigRepository {
  constructor(
    private readonly selectedProvider: {
      id: string;
      identityId: string;
      providerType: string;
      baseUrl: string;
      apiKey: string;
      defaultModel: string | null;
      isActive: boolean;
      name?: string;
    },
  ) {}

  async findById(id: string) {
    return id === this.selectedProvider.id ? this.selectedProvider : null;
  }

  async findDefaultByIdentityId() {
    return null;
  }

  async findByIdentityId() {
    return [this.selectedProvider];
  }
}

class StubChatExecutionPort implements IAIChatExecutionPort {
  public readonly complete = vi.fn<
    (input: ChatExecutionCompleteInput) => Promise<ChatExecutionCompleteResult>
  >(async () => ({
    content: 'Assistant reply from ai-service',
    finishReason: 'stop',
    usage: {
      promptTokens: 12,
      completionTokens: 8,
      totalTokens: 20,
    },
  }));

  public readonly stream = vi.fn<
    (
      input: ChatExecutionCompleteInput,
    ) => AsyncGenerator<{ content: string; finishReason?: string }, void, void>
  >((input) =>
    (async function* streamGenerator() {
      if (input.signal?.aborted) {
        const abortedError = new Error('stream aborted');
        (abortedError as Error & { category?: string }).category = 'aborted';
        throw abortedError;
      }

      yield {
        content: 'streamed content',
        finishReason: 'stop',
      };
    })(),
  );
}

class StubExecutionLogPort implements IAIExecutionLogPort {
  public readonly record = vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {});
}

describe('SendAIMessageUseCase', () => {
  it('routes chat execution through the execution port with structured messages', async () => {
    const identityId = 'IdentityId_550e8400-e29b-41d4-a716-446655440000';
    const conversation = AIConversation.create({
      identityId,
      name: 'Test conversation',
    });

    const conversationRepository = new InMemoryConversationRepository(conversation);
    const providerRepository = new StubProviderConfigRepository({
      id: 'provider-1',
      identityId,
      providerType: AIProviderType.OpenAICompatible,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'secret-key',
      defaultModel: 'gpt-4o-mini',
      isActive: true,
      name: 'Main provider',
    });
    const executionPort = new StubChatExecutionPort();
    const executionLogPort = new StubExecutionLogPort();

    const useCase = new SendAIMessageUseCase(
      conversationRepository as unknown as IAIConversationRepository,
      providerRepository as unknown as IAIProviderConfigRepository,
      executionPort,
      executionLogPort,
    );

    const result = await useCase.execute(
      identityId,
      String(conversation.id),
      'Hello from user',
      'provider-1',
    );

    expect(result.ok).toBe(true);
    const data = (result as any).data;

    expect(executionPort.complete).toHaveBeenCalledTimes(1);
    expect(executionPort.complete).toHaveBeenCalledWith({
      identityId,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Hello from user',
        },
      ],
      providerConfig: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: 'secret-key',
        baseUrl: 'https://api.openai.com/v1',
        temperature: 0.7,
      },
      requestId: expect.any(String),
    });

    expect(data.assistantMessage.content).toBe('Assistant reply from ai-service');
    expect(data.providerId).toBe('provider-1');
    expect(data.tokenUsage.totalTokens).toBe(20);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'CHAT_COMPLETE',
        status: 'COMPLETED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
        costEstimate: expect.objectContaining({
          pricingModel: 'gpt-4o-mini',
          totalCostUsd: expect.any(Number),
        }),
      }),
    );
  });
});

describe('StreamAIMessageUseCase', () => {
  it('returns error result for aborted streaming requests and keeps failed stream metadata', async () => {
    const identityId = 'IdentityId_550e8400-e29b-41d4-a716-446655440000';
    const conversation = AIConversation.create({
      identityId,
      name: 'Test conversation',
    });

    const conversationRepository = new InMemoryConversationRepository(conversation);
    const providerRepository = new StubProviderConfigRepository({
      id: 'provider-1',
      identityId,
      providerType: AIProviderType.OpenAICompatible,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'secret-key',
      defaultModel: 'gpt-4o-mini',
      isActive: true,
      name: 'Main provider',
    });
    const executionPort = new StubChatExecutionPort();
    executionPort.stream.mockImplementation((input) =>
      (async function* abortingGenerator() {
        const abortedError = new Error('stream aborted');
        (abortedError as Error & { category?: string }).category = 'aborted';

        if (input.signal?.aborted) {
          throw abortedError;
        }
        yield {
          content: 'unexpected',
          finishReason: 'stop',
        };
      })(),
    );
    const executionLogPort = new StubExecutionLogPort();

    const useCase = new StreamAIMessageUseCase(
      conversationRepository as unknown as IAIConversationRepository,
      providerRepository as unknown as IAIProviderConfigRepository,
      executionPort,
      executionLogPort,
    );

    const streamAbortController = new AbortController();
    streamAbortController.abort();

    const result = await useCase.execute(
      identityId,
      String(conversation.id),
      'Hello from user',
      vi.fn(),
      'provider-1',
      undefined,
      streamAbortController.signal,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/requestId:/i);
    }

    expect(executionPort.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: streamAbortController.signal,
      }),
    );

    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'CHAT_STREAM',
        status: 'FAILED',
        errorCategory: 'aborted',
      }),
    );
  });
});
