import type {
  ChatExecutionCompleteInput,
  ChatExecutionCompleteResult,
  ChatExecutionStreamChunk,
  ChatExecutionUsage,
  IAIChatExecutionPort,
} from '../../application-server/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

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
        const payload = JSON.parse(event.data) as {
          content?: string;
          finish_reason?: string | null;
        };
        yield {
          content: payload.content ?? '',
          finishReason: payload.finish_reason ?? undefined,
        };
        continue;
      }

      if (event.event === 'error') {
        const payload = event.data ? JSON.parse(event.data) as { detail?: string } : {};
        throw new Error(payload.detail ?? 'ai-service stream failed');
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

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

async function* parseSSE(
  response: Response,
): AsyncGenerator<{ event: string; data: string }, void, void> {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    while (true) {
      const boundaryIndex = buffer.indexOf('\n\n');
      if (boundaryIndex < 0) {
        break;
      }

      const rawEvent = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);

      let event = 'message';
      const dataLines: string[] = [];
      for (const line of rawEvent.split(/\r?\n/)) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }

      yield {
        event,
        data: dataLines.join('\n'),
      };
    }
  }
}
