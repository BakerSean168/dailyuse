/**
 * AIAssistantHttpAdapter — residual 347 client for AssistantFacade SSE dispatch.
 * POST /ai/assistant/dispatch/sse streams Host-normalized AssistantEvent.
 * Residual 963: findSSEBoundary sole import (packages/ai/src/shared/find-sse-boundary.ts).
 * Residual 967: isAbortLikeError sole import (packages/ai/src/shared/is-abort-like-error.ts).
 */
import type { AssistantClientCommand, AssistantEvent } from '@dailyuse/contracts/ai';
import type { ResultErrorDetail } from '@dailyuse/contracts/result';
import type { IAIAssistantApiClient, IResultHttpClient } from '../types';
import {
  createResultClientError,
  createResultClientErrorFromResponse,
} from '../result-client-error';
import { findSSEBoundary } from '../../../shared/find-sse-boundary';
import { isAbortLikeError } from '../../../shared/is-abort-like-error';

export class AIAssistantHttpAdapter implements IAIAssistantApiClient {
  private readonly streamUrl = '/ai/assistant/dispatch/sse';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async dispatchAssistant(
    command: AssistantClientCommand,
    handlers: {
      onEvent?: (event: AssistantEvent) => void;
      onDone?: (result: { eventCount: number }) => void;
    },
    signal?: AbortSignal,
  ): Promise<void> {
    // Never send identityId — server injects from auth.
    if ('identityId' in (command as object)) {
      throw createResultClientError(
        'identityId must not be sent in assistant client commands',
        'VALIDATION_ERROR',
      );
    }

    let response: Response;
    try {
      response = await this.httpClient.stream(this.streamUrl, {
        method: 'POST',
        body: command,
        signal,
      });
    } catch (error) {
      if (isAbortLikeError(error) || signal?.aborted) {
        throw createResultClientError('请求已取消', 'ABORTED');
      }
      throw error;
    }

    if (!response.ok) {
      throw await createResultClientErrorFromResponse(
        response,
        `Assistant dispatch failed: ${response.status}`,
      );
    }

    let completed = false;
    try {
      for await (const event of parseSSE(response)) {
        if (event.event === 'assistant' && event.data) {
          handlers.onEvent?.(JSON.parse(event.data) as AssistantEvent);
          continue;
        }

        if (event.event === 'done' && event.data) {
          completed = true;
          handlers.onDone?.(JSON.parse(event.data) as { eventCount: number });
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
            payload.message ?? 'Assistant dispatch failed',
            payload.code ?? 'INTERNAL_ERROR',
            undefined,
            payload.details,
          );
        }
      }

      if (!completed) {
        throw createResultClientError('Assistant 响应流在完成前已断开', 'STREAM_TERMINATED');
      }
    } catch (error) {
      if (isAbortLikeError(error) || signal?.aborted) {
        throw createResultClientError('请求已取消', 'ABORTED');
      }
      throw error;
    }
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

