import { describe, expect, it, vi } from 'vitest';

import { AIConversation } from '../../../../domain-server/aggregates/ai-conversation';
import { AIProviderType } from '@dailyuse/contracts/ai';
import type { IAIConversationRepository } from '../../../../domain-server/repositories/IAIConversationRepository';
import type { IAIProviderConfigRepository } from '../../../../domain-server/repositories/IAIProviderConfigRepository';
import { AIChatApplicationService } from '../a-i-chat-application-service';
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
}

class StubExecutionLogPort implements IAIExecutionLogPort {
  public readonly record = vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {});
}

describe('AIChatApplicationService', () => {
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

    const service = new AIChatApplicationService(
      conversationRepository as unknown as IAIConversationRepository,
      providerRepository as unknown as IAIProviderConfigRepository,
      executionPort,
      executionLogPort,
    );

    const result = await service.sendMessage(
      identityId,
      String(conversation.id),
      'Hello from user',
      'provider-1',
    );

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

    expect(result.assistantMessage.content).toBe('Assistant reply from ai-service');
    expect(result.providerId).toBe('provider-1');
    expect(result.tokenUsage.totalTokens).toBe(20);
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
