/**
 * Residual 963: findSSEBoundary sole import (packages/ai/src/shared/find-sse-boundary.ts).
 * Residual 967: isAbortLikeError sole import (packages/ai/src/shared/is-abort-like-error.ts).
 */
import type { IAIMessageApiClient, IResultHttpClient } from '../types';
import type { Result, ResultErrorDetail } from '@dailyuse/contracts/result';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';
import {
  createResultClientError,
  createResultClientErrorFromResponse,
} from '../result-client-error';
import { findSSEBoundary } from '../../../shared/find-sse-boundary';
import { isAbortLikeError } from '../../../shared/is-abort-like-error';

export class AIMessageHttpAdapter implements IAIMessageApiClient {
  private readonly baseUrl = '/ai/chat/messages';
  private readonly streamUrl = '/ai/chat/messages/sse';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async sendMessage(request: SendMessageReq): Promise<Result<SendMessageRes>> {
    return this.httpClient.post<SendMessageRes>(this.baseUrl, request);
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
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await this.httpClient.stream(this.streamUrl, {
        method: 'POST',
        body: request,
        signal,
      });
    } catch (error) {
      if (isAbortLikeError(error) || signal?.aborted) {
        throw createResultClientError('请求已取消', 'ABORTED');
      }
      throw error;
    }

    // Bootstrap failure: the SSE stream never started, so we still have a
    // normal HTTP response envelope and can convert it into a structured error.
    if (!response.ok) {
      throw await createResultClientErrorFromResponse(
        response,
        `AI stream request failed: ${response.status}`,
      );
    }

    // Once the stream is open, the server communicates only through SSE events.
    // The front-end contract is intentionally small:
    // - `message`: incremental assistant delta
    // - `done`: final persisted message payload
    // - `error`: structured application error after stream bootstrap
    let completed = false;
    try {
      for await (const event of parseSSE(response)) {
        if (event.event === 'message' && event.data) {
          const payload = JSON.parse(event.data) as { role: 'assistant'; content: string };
          handlers.onChunk?.(payload);
          continue;
        }

        if (event.event === 'done' && event.data) {
          completed = true;
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

      if (!completed) {
        throw createResultClientError('AI 响应流在完成前已断开', 'STREAM_TERMINATED');
      }
    } catch (error) {
      if (isAbortLikeError(error) || signal?.aborted) {
        throw createResultClientError('请求已取消', 'ABORTED');
      }
      throw error;
    }
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<Result<MessageListRes>> {
    return this.httpClient.get<MessageListRes>(this.baseUrl, {
      params: { conversationId, ...params },
    });
  }
}

async function* parseSSE(
  response: Response,
): AsyncGenerator<{ event: string; data: string }, void, void> {
  if (!response.body) {
    return;
  }

  // Manual SSE parsing is used instead of EventSource because the request is a
  // POST carrying JSON body data. That fits AI chat prompts better than the
  // GET-only EventSource API.
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
      // An SSE event may span multiple network chunks. Keep buffering until a
      // blank-line boundary is found, then emit exactly one parsed event.
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

