import type {
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  ChatExecutionStreamChunk,
  IAIChatExecutionPort,
} from '../../application/ports';
import { OpenAICompatibleGateway } from '../gateways/openai-compatible.gateway';

/**
 * Direct OpenAI-compatible chat execution adapter (Mastra-only runtime).
 *
 * AI-VNEXT-07: replaces the deleted `DirectProviderChatExecutionAdapter` that
 * routed through the legacy CustomModelGateway. Provider connection tests and
 * any remaining direct chat execution now go straight to the OpenAI-compatible
 * BYOK gateway — no second gateway abstraction, no Python AIService.
 *
 * AI-VNEXT-07：替代已删除的、经旧 CustomModelGateway 路由的
 * `DirectProviderChatExecutionAdapter`。Provider 连接测试与残余直连 chat
 * execution 现在直连 OpenAI-compatible BYOK gateway——没有第二 gateway 抽象，
 * 也没有 Python AIService。
 */
export class OpenAICompatibleChatExecutionAdapter implements IAIChatExecutionPort {
  constructor(private readonly gateway: OpenAICompatibleGateway) {}

  async complete(input: ChatExecutionCompleteInput): Promise<ChatExecutionCompleteResult> {
    const completion = await this.gateway.complete({
      baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
      apiKey: input.providerConfig.apiKey,
      model: input.providerConfig.model,
      messages: input.messages,
      temperature: input.providerConfig.temperature ?? 0.3,
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
    // OpenAICompatibleGateway currently only exposes complete(); streaming is
    // handled by the Mastra assistant runtime. Yield a single completion chunk
    // to keep the port contract satisfied without a second gateway.
    const completion = await this.complete(input);
    yield { content: completion.content, finishReason: completion.finishReason };
  }
}
