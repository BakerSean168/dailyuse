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

function createCrlfSseEvent(event: string, data: unknown): string {
  return `event: ${event}\r\ndata: ${JSON.stringify(data)}\r\n\r\n`;
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

  it('parses CRLF-delimited SSE messages and done events', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();
    const httpClient = createHttpClientStub({
      stream: vi.fn().mockResolvedValue(
        createSseResponse([
          createCrlfSseEvent('message', { role: 'assistant', content: '2' }),
          createCrlfSseEvent('done', {
            userMessage: { id: 'user-1', content: '1+1' },
            assistantMessage: { id: 'assistant-1', content: '2' },
            tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
            providerId: 'provider-1',
            processingTimeMs: 123,
          }),
        ]),
      ),
    });
    const adapter = new AIMessageHttpAdapter(httpClient);

    await expect(
      adapter.streamMessage(
        { conversationId: 'conv-1' as never, content: '1+1' },
        { onChunk, onDone },
      ),
    ).resolves.toBeUndefined();

    expect(onChunk).toHaveBeenCalledWith({ role: 'assistant', content: '2' });
    expect(onDone).toHaveBeenCalledWith({
      userMessage: { id: 'user-1', content: '1+1' },
      assistantMessage: { id: 'assistant-1', content: '2' },
      tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      providerId: 'provider-1',
      processingTimeMs: 123,
    });
  });
});
