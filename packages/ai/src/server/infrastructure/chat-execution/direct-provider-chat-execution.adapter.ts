import type {
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  ChatExecutionStreamChunk,
  IAIChatExecutionPort,
} from '../../application/ports';
import type { IModelGatewayPort } from '@dailyuse/contracts/ai';
import { CustomModelGateway } from '../model-gateway';

/**
 * Direct provider adapter used when the host runtime does not want to route
 * chat execution through the Python ai-service yet.
 *
 * Residual 337: completions go through CustomModelGateway (IModelGatewayPort),
 * not a parallel raw OpenAICompatibleGateway bypass.
 */
export class DirectProviderChatExecutionAdapter implements IAIChatExecutionPort {
  constructor(private readonly modelGateway: IModelGatewayPort = new CustomModelGateway()) {}

  async complete(input: ChatExecutionCompleteInput): Promise<ChatExecutionCompleteResult> {
    const completion = await this.modelGateway.complete({
      auth: {
        bindingId: `${input.providerConfig.provider}:${input.providerConfig.model}`,
        baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
        apiKey: input.providerConfig.apiKey,
      },
      model: input.providerConfig.model,
      messages: input.messages,
      temperature: input.providerConfig.temperature ?? 0.7,
      maxTokens: input.providerConfig.maxTokens,
      responseFormat: 'text',
      signal: input.signal,
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
    for await (const chunk of this.modelGateway.stream({
      auth: {
        bindingId: `${input.providerConfig.provider}:${input.providerConfig.model}`,
        baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
        apiKey: input.providerConfig.apiKey,
      },
      model: input.providerConfig.model,
      messages: input.messages,
      temperature: input.providerConfig.temperature ?? 0.7,
      maxTokens: input.providerConfig.maxTokens,
      responseFormat: 'text',
      signal: input.signal,
    })) {
      yield chunk;
    }
  }
}
