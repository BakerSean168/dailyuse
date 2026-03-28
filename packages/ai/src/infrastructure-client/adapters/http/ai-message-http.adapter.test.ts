import { describe, expect, it, vi } from 'vitest';
import { AIMessageHttpAdapter } from './ai-message-http.adapter';
import { ResultClientError } from '../result-client-error';
import type { IResultHttpClient } from '../types';

function createHttpClientStub(overrides?: Partial<IResultHttpClient>): IResultHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    stream: vi.fn(),
    ...overrides,
  };
}

function createSseResponse(events: string[]): Response {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(event));
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    },
  );
}

describe('AIMessageHttpAdapter', () => {
  it('preserves result error code for sendMessage failures', async () => {
    const httpClient = createHttpClientStub({
      post: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权，请登录',
          details: [{ code: 'TOKEN_MISSING', message: 'missing token' }],
        },
      }),
    });
    const adapter = new AIMessageHttpAdapter(httpClient);

    await expect(
      adapter.sendMessage({ conversationId: 'conv-1' as never, content: 'hi' }),
    ).rejects.toMatchObject({
      name: 'ResultErrorException',
      code: 'UNAUTHORIZED',
      message: '未授权，请登录',
      details: [{ code: 'TOKEN_MISSING', message: 'missing token' }],
    } satisfies Partial<ResultClientError>);
  });

  it('preserves HTTP envelope code for stream bootstrap failures', async () => {
    const httpClient = createHttpClientStub({
      stream: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            code: 401,
            message: '未授权，请登录',
            error: { code: 'UNAUTHORIZED', message: '未授权，请登录' },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    });
    const adapter = new AIMessageHttpAdapter(httpClient);

    await expect(
      adapter.streamMessage(
        { conversationId: 'conv-1' as never, content: 'hi' },
        {},
      ),
    ).rejects.toMatchObject({
      name: 'ResultErrorException',
      code: 'UNAUTHORIZED',
      message: '未授权，请登录',
      statusCode: 401,
    } satisfies Partial<ResultClientError>);
  });

  it('preserves SSE error codes emitted after stream starts', async () => {
    const httpClient = createHttpClientStub({
      stream: vi.fn().mockResolvedValue(
        createSseResponse([
          `event: error\ndata: ${JSON.stringify({
            code: 'RATE_LIMITED',
            message: '请求过于频繁',
            details: [{ code: 'RETRY_LATER', message: 'slow down' }],
          })}\n\n`,
        ]),
      ),
    });
    const adapter = new AIMessageHttpAdapter(httpClient);

    await expect(
      adapter.streamMessage(
        { conversationId: 'conv-1' as never, content: 'hi' },
        {},
      ),
    ).rejects.toMatchObject({
      name: 'ResultErrorException',
      code: 'RATE_LIMITED',
      message: '请求过于频繁',
      details: [{ code: 'RETRY_LATER', message: 'slow down' }],
    } satisfies Partial<ResultClientError>);
  });
});
