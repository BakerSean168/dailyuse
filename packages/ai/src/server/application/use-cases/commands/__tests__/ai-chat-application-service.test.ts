import { describe, expect, it, vi } from 'vitest';

import { AIConversation } from '../../../../domain/aggregates/ai-conversation';
import { AIProviderType } from '@memoflow/contracts/ai';
import type { IAIConversationRepository } from '../../../../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../../../domain/repositories/i-ai-provider-config-repository';
import { SendAIMessageUseCase } from '../send-ai-message.use-case';
import { StreamAIMessageUseCase } from '../stream-ai-message.use-case';
import { DirectTurnEngine } from '../../../../infrastructure/turn-engine';
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

  async findByIdForIdentity(identityId: string, _id: string): Promise<AIConversation | null> {
    return String(this.conversation.identityId) === identityId ? this.conversation : null;
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

  async findByIdForIdentity(identityId: string, id: string) {
    if (this.selectedProvider.id !== id || this.selectedProvider.identityId !== identityId) {
      return null;
    }
    return this.selectedProvider;
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

function executionContext(identityId: string) {
  return {
    requestId: 'req-chat-app-1',
    traceId: 'req-chat-app-1',
    startedAt: 1_700_000_000_000,
    source: 'http',
    identityId,
    deviceId: 'test-device',
  };
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

    const turnEngine = new DirectTurnEngine(
      conversationRepository as unknown as IAIConversationRepository,
      providerRepository as unknown as IAIProviderConfigRepository,
      executionPort,
    );
    const useCase = new SendAIMessageUseCase(turnEngine, executionLogPort);

    const result = await useCase.execute(
      String(conversation.id),
      'Hello from user',
      executionContext(identityId),
      'provider-1',
    );

    expect(result.ok).toBe(true);
    const data = (result as any).data;

    expect(executionPort.complete).toHaveBeenCalledTimes(1);
    expect(executionPort.complete).toHaveBeenCalledWith(
      expect.objectContaining({
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
        providerConfig: expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'secret-key',
          baseUrl: 'https://api.openai.com/v1',
          temperature: 0.7,
        }),
        requestId: 'req-chat-app-1',
        signal: expect.any(AbortSignal),
      }),
    );

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
        requestId: 'req-chat-app-1',
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

    const turnEngine = new DirectTurnEngine(
      conversationRepository as unknown as IAIConversationRepository,
      providerRepository as unknown as IAIProviderConfigRepository,
      executionPort,
    );
    const useCase = new StreamAIMessageUseCase(turnEngine, executionLogPort);

    const streamAbortController = new AbortController();
    streamAbortController.abort();

    const result = await useCase.execute(
      String(conversation.id),
      'Hello from user',
      vi.fn(),
      executionContext(identityId),
      'provider-1',
      undefined,
      streamAbortController.signal,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).not.toMatch(/requestId:/i);
    }

    expect(executionPort.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    // The engine bridges the caller signal to its own controller; the
    // behavioural contract is that the port receives an already-aborted signal.
    const streamCall = executionPort.stream.mock.calls[0]?.[0] as
      { signal?: AbortSignal } | undefined;
    expect(streamCall?.signal?.aborted).toBe(true);

    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'CHAT_STREAM',
        status: 'FAILED',
        errorCategory: 'aborted',
        requestId: expect.any(String),
      }),
    );
  });
});
