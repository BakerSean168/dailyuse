/**
 * AIAssistantHttpAdapter — residual 347 client for AssistantFacade SSE dispatch.
 * POST /ai/assistant/dispatch/sse streams Host-normalized AssistantEvent.
 *
 * Framing contract (plan §4.4):
 * - `event: assistant` + `data: AssistantEvent` per Host event
 * - `event: error` + `data: { code, message, details? }` on failure
 * - `event: done` + `data: AssistantDispatchResult` on success
 *
 * Hardening (plan Step B §5.2):
 * - Every `assistant` / `done` payload is JSON.parse'd and validated against the
 *   shared runtime schema; malformed JSON, wrong shape and unknown event names
 *   all become `ASSISTANT_PROTOCOL_ERROR` — never a silent cast.
 * - Only bootstrap route absence (404/405/501) is normalized to
 *   `ASSISTANT_DISPATCH_UNAVAILABLE`. Once a 2xx SSE stream is open, any
 *   transport `error` frame or premature EOF is NOT dispatch-unavailable.
 *
 * Residual 963: findSSEBoundary sole import (packages/ai/src/shared/find-sse-boundary.ts).
 * Residual 977: parseSSE sole import (packages/ai/src/shared/parse-sse.ts).
 * Residual 967: isAbortLikeError sole import (packages/ai/src/shared/is-abort-like-error.ts).
 */
import {
  ASSISTANT_DISPATCH_UNAVAILABLE,
  ASSISTANT_PROTOCOL_ERROR,
  AssistantDispatchResultSchema,
  AssistantEventSchema,
  type AssistantClientCommand,
  type AssistantDispatchHandlers,
} from '@memoflow/contracts/ai';
import type { ResultErrorDetail } from '@memoflow/contracts/result';
import type { IAIAssistantApiClient, IResultHttpClient } from '../types';
import {
  createResultClientError,
  createResultClientErrorFromResponse,
} from '../result-client-error';
import { parseSSE } from '../../../shared/parse-sse';
import { isAbortLikeError } from '../../../shared/is-abort-like-error';

/** Bootstrap statuses that mean the Host has NO dispatch route at all. */
const DISPATCH_UNAVAILABLE_STATUSES = [404, 405, 501] as const;

function isDispatchUnavailableStatus(status: number): boolean {
  return (DISPATCH_UNAVAILABLE_STATUSES as readonly number[]).includes(status);
}

function parsePayload(data: string, kind: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    throw createResultClientError(
      `Assistant dispatch ${kind} payload is not valid JSON`,
      ASSISTANT_PROTOCOL_ERROR,
    );
  }
}

export class AIAssistantHttpAdapter implements IAIAssistantApiClient {
  private readonly streamUrl = '/ai/assistant/dispatch/sse';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async dispatchAssistant(
    command: AssistantClientCommand,
    handlers: AssistantDispatchHandlers,
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
      const error = await createResultClientErrorFromResponse(
        response,
        `Assistant dispatch failed: ${response.status}`,
      );
      // Only bootstrap route absence is dispatch-unavailable. 2xx is entered
      // afterwards, so any transport error frame / EOF is never downgraded.
      if (isDispatchUnavailableStatus(response.status)) {
        throw createResultClientError(
          error.message,
          ASSISTANT_DISPATCH_UNAVAILABLE,
          response.status,
          error.details,
        );
      }
      throw error;
    }

    let completed = false;
    try {
      for await (const event of parseSSE(response)) {
        if (event.event === 'assistant') {
          if (!event.data) {
            throw createResultClientError(
              'Assistant dispatch assistant frame is missing a payload',
              ASSISTANT_PROTOCOL_ERROR,
            );
          }
          const parsed = AssistantEventSchema.safeParse(parsePayload(event.data, 'assistant'));
          if (!parsed.success) {
            throw createResultClientError(
              'Assistant dispatch assistant frame failed protocol validation',
              ASSISTANT_PROTOCOL_ERROR,
            );
          }
          handlers.onEvent?.(parsed.data);
          continue;
        }

        if (event.event === 'done') {
          if (!event.data) {
            throw createResultClientError(
              'Assistant dispatch done frame is missing a payload',
              ASSISTANT_PROTOCOL_ERROR,
            );
          }
          const parsed = AssistantDispatchResultSchema.safeParse(
            parsePayload(event.data, 'done'),
          );
          if (!parsed.success) {
            throw createResultClientError(
              'Assistant dispatch done frame failed protocol validation',
              ASSISTANT_PROTOCOL_ERROR,
            );
          }
          completed = true;
          handlers.onDone?.(parsed.data);
          return;
        }

        if (event.event === 'error') {
          const payload = event.data
            ? (parsePayload(event.data, 'error') as {
                code?: string;
                message?: string;
                details?: ResultErrorDetail[];
              })
            : {};
          if (typeof payload.code !== 'string' || typeof payload.message !== 'string') {
            throw createResultClientError(
              'Assistant dispatch transport error frame is malformed',
              ASSISTANT_PROTOCOL_ERROR,
            );
          }
          throw createResultClientError(
            payload.message,
            payload.code,
            undefined,
            payload.details,
          );
        }

        // Unknown SSE event name — protocol failure, never silently ignored.
        throw createResultClientError(
          `Assistant dispatch received unknown SSE event '${event.event}'`,
          ASSISTANT_PROTOCOL_ERROR,
        );
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
