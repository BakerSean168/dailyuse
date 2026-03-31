import type { IAIMessageApiClient, IResultHttpClient } from '../types';
import type { ResultErrorDetail } from '@dailyuse/contracts/result';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';
import {
  createResultClientError,
  createResultClientErrorFromResponse,
  unwrapResultOrThrow,
} from '../result-client-error';

export class AIMessageHttpAdapter implements IAIMessageApiClient {
  private readonly baseUrl = '/ai/chat/messages';
  private readonly streamUrl = '/ai/chat/messages/sse';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.httpClient.post<SendMessageRes>(this.baseUrl, request);
    return unwrapResultOrThrow(result);
  }

  async streamMessage(
    request: SendMessageReq,
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: {
        userMessage: SendMessageRes['userMessage'];
        assistantMessage: SendMessageRes['assistantMessage'];
        tokenUsage: SendMessageRes['tokenUsage'];
        providerId: SendMessageRes['providerId'];
        processingTimeMs: number;
      }) => void;
    },
  ): Promise<void> {
    const response = await this.httpClient.stream(this.streamUrl, {
      method: 'POST',
      body: request,
    });

    if (!response.ok) {
      throw await createResultClientErrorFromResponse(
        response,
        `AI stream request failed: ${response.status}`,
      );
    }

    for await (const event of parseSSE(response)) {
      if (event.event === 'message' && event.data) {
        const payload = JSON.parse(event.data) as { role: 'assistant'; content: string };
        handlers.onChunk?.(payload);
        continue;
      }

      if (event.event === 'done' && event.data) {
        handlers.onDone?.(
          JSON.parse(event.data) as {
            userMessage: SendMessageRes['userMessage'];
            assistantMessage: SendMessageRes['assistantMessage'];
            tokenUsage: SendMessageRes['tokenUsage'];
            providerId: SendMessageRes['providerId'];
            processingTimeMs: number;
          },
        );
        return;
      }

      if (event.event === 'error') {
        const payload = event.data
          ? (JSON.parse(event.data) as {
              code?: string;
              message?: string;
              details?: ResultErrorDetail[];
            })
          : {};
        throw createResultClientError(
          payload.message ?? 'AI stream failed',
          payload.code ?? 'INTERNAL_ERROR',
          undefined,
          payload.details,
        );
      }
    }
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes> {
    const result = await this.httpClient.get<MessageListRes>(this.baseUrl, {
      params: { conversationId, ...params },
    });
    return unwrapResultOrThrow(result);
  }
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
      const boundary = findSSEBoundary(buffer);
      if (!boundary) {
        break;
      }

      const rawEvent = buffer.slice(0, boundary.index);
      buffer = buffer.slice(boundary.index + boundary.length);

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

function findSSEBoundary(buffer: string): { index: number; length: number } | null {
  const crlfBoundaryIndex = buffer.indexOf('\r\n\r\n');
  if (crlfBoundaryIndex >= 0) {
    return { index: crlfBoundaryIndex, length: 4 };
  }

  const lfBoundaryIndex = buffer.indexOf('\n\n');
  if (lfBoundaryIndex >= 0) {
    return { index: lfBoundaryIndex, length: 2 };
  }

  return null;
}
