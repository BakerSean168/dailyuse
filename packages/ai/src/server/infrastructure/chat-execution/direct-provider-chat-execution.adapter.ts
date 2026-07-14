import type {
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  ChatExecutionStreamChunk,
  IAIChatExecutionPort,
} from '../../application/ports';
import { OpenAICompatibleGateway } from '../gateways/openai-compatible.gateway';

/**
 * Direct provider adapter used when the host runtime does not want to route
 * chat execution through the Python ai-service yet.
 */
export class DirectProviderChatExecutionAdapter implements IAIChatExecutionPort {
  constructor(private readonly gateway: OpenAICompatibleGateway = new OpenAICompatibleGateway()) {}

  async complete(input: ChatExecutionCompleteInput): Promise<ChatExecutionCompleteResult> {
    const completion = await this.gateway.complete({
      baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
      apiKey: input.providerConfig.apiKey,
      model: input.providerConfig.model,
      messages: input.messages,
      temperature: input.providerConfig.temperature ?? 0.7,
      maxTokens: input.providerConfig.maxTokens,
      responseFormat: 'text',
    });

    return {
      content: completion.content,
      finishReason: completion.finishReason ?? 'stop',
      usage: completion.usage,
    };
  }

  async *stream(
    input: ChatExecutionCompleteInput,
  ): AsyncGenerator<ChatExecutionStreamChunk, void, void> {
    const completion = await this.complete(input);
    yield {
      content: completion.content,
      finishReason: completion.finishReason,
    };
  }
}


