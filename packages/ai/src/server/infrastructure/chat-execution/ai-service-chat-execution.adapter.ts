/**
 * Residual 963: findSSEBoundary sole import (packages/ai/src/shared/find-sse-boundary.ts).
 * Residual 977: parseSSE sole import (packages/ai/src/shared/parse-sse.ts).
 */
import type {
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  ChatExecutionStreamChunk,
  ChatExecutionUsage,
  IAIChatExecutionPort,
} from '../../application/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';
import { parseSSE } from '../../../shared/parse-sse';

interface AIServiceChatCompleteResponse {
  content: string;
  finish_reason: string;
  usage?: Record<string, unknown> | null;
}

/**
 * Adapter that calls the internal Python ai-service.
 */
export class AIServiceChatExecutionAdapter implements IAIChatExecutionPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async complete(input: ChatExecutionCompleteInput): Promise<ChatExecutionCompleteResult> {
    const payload = await this.client.postJson<
      AIServiceChatCompleteResponse,
      {
        messages: ChatExecutionCompleteInput['messages'];
        provider_config: {
          provider: string;
          model: string;
          api_key: string;
          base_url?: string;
          temperature?: number;
          max_tokens?: number;
        };
        request_id?: string;
      }
    >({
      path: '/internal/chat/complete',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        messages: input.messages,
        provider_config: {
          provider: input.providerConfig.provider,
          model: input.providerConfig.model,
          api_key: input.providerConfig.apiKey,
        base_url: input.providerConfig.baseUrl,
        temperature: input.providerConfig.temperature ?? 0.7,
        max_tokens: input.providerConfig.maxTokens,
        },
        request_id: input.requestId,
      },
    });
    return {
      content: payload.content,
      finishReason: payload.finish_reason,
      usage: normalizeUsage(payload.usage),
    };
  }

  async *stream(
    input: ChatExecutionCompleteInput,
  ): AsyncGenerator<ChatExecutionStreamChunk, void, void> {
    const response = await this.client.postStream({
      path: '/internal/chat/stream',
      identityId: input.identityId,
      requestId: input.requestId,
      signal: input.signal,
      body: {
        messages: input.messages,
        provider_config: {
          provider: input.providerConfig.provider,
          model: input.providerConfig.model,
          api_key: input.providerConfig.apiKey,
          base_url: input.providerConfig.baseUrl,
          temperature: input.providerConfig.temperature ?? 0.7,
          max_tokens: input.providerConfig.maxTokens,
        },
        request_id: input.requestId,
      },
    });

    for await (const event of parseSSE(response)) {
      if (event.event === 'message' && event.data) {
        try {
          const payload = JSON.parse(event.data) as {
            content?: string;
            finish_reason?: string | null;
          };
          // Always yield message events, even if content is empty (for finish_reason)
          yield {
            content: payload.content ?? '',
            finishReason: payload.finish_reason ?? undefined,
          };
        } catch (parseError) {
          console.error('[AIServiceAdapter] Failed to parse SSE message', { 
            rawData: event.data, 
            error: parseError instanceof Error ? parseError.message : String(parseError) 
          });
          continue;
        }
        continue;
      }

      if (event.event === 'error') {
        try {
          const payload = event.data ? (JSON.parse(event.data) as { detail?: string }) : {};
          throw new Error(payload.detail ?? 'ai-service stream error');
        } catch (_e) {
          throw new Error(`ai-service returned error: ${event.data || 'unknown'}`);
        }
      }

      if (event.event === 'done') {
        return;
      }
    }
  }
}

function normalizeUsage(usage: Record<string, unknown> | null | undefined): ChatExecutionUsage {
  if (!usage) {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  const promptTokens = toNumber(usage.prompt_tokens) ?? toNumber(usage.input_tokens) ?? 0;
  const completionTokens =
    toNumber(usage.completion_tokens) ?? toNumber(usage.output_tokens) ?? 0;
  const totalTokens = toNumber(usage.total_tokens) ?? promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

// Residual 1105 keep-boundary: provider usage tokens are numeric only (no string Number()).
// Soft residual 1105: goal-planning toNumber allows numeric strings from LLM JSON (no force-merge).
function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}


