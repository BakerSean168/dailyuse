import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  AIServiceChatExecutionAdapter,
  INTERNAL_CONTENT_HASH_HEADER,
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
  signInternalRequest,
} from '..';

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

describe('AIServiceChatExecutionAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('signs the internal request and normalizes provider usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'hello from python',
        finish_reason: 'stop',
        usage: {
          prompt_tokens: 11,
          completion_tokens: 7,
          total_tokens: 18,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = new AIServiceChatExecutionAdapter({
      baseUrl: 'http://127.0.0.1:8100',
      serviceSecret: 'shared-secret',
      serviceName: 'dailyuse-api',
      timeoutMs: 5_000,
    });

    await expect(
      adapter.complete({
        identityId: 'identity-1',
        requestId: 'request-1',
        messages: [{ role: 'user', content: 'hello' }],
        providerConfig: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'provider-key',
          baseUrl: 'https://api.openai.com/v1',
          temperature: 0.7,
        },
      }),
    ).resolves.toEqual({
      content: 'hello from python',
      finishReason: 'stop',
      usage: {
        promptTokens: 11,
        completionTokens: 7,
        totalTokens: 18,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:8100/internal/chat/complete');

    const body = String(init.body);
    const timestamp = Number((init.headers as Record<string, string>)[INTERNAL_TIMESTAMP_HEADER]);
    const signature = signInternalRequest({
      serviceName: 'dailyuse-api',
      method: 'POST',
      path: '/internal/chat/complete',
      timestamp,
      body,
      secret: 'shared-secret',
    });

    expect((init.headers as Record<string, string>)[INTERNAL_SERVICE_HEADER]).toBe(
      'dailyuse-api',
    );
    expect((init.headers as Record<string, string>)['X-Request-Id']).toBe('request-1');
    expect((init.headers as Record<string, string>)['X-Identity-Id']).toBe('identity-1');
    expect((init.headers as Record<string, string>)[INTERNAL_CONTENT_HASH_HEADER]).toBeDefined();
    expect((init.headers as Record<string, string>)[INTERNAL_SIGNATURE_HEADER]).toBe(
      signature.signature,
    );
  });

  it('parses CRLF-delimited SSE chunks from ai-service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        'event: message\r\ndata: {"content":"2","finish_reason":"stop"}\r\n\r\n',
        'event: done\r\ndata: \r\n\r\n',
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const adapter = new AIServiceChatExecutionAdapter({
      baseUrl: 'http://127.0.0.1:8100',
      serviceSecret: 'shared-secret',
      serviceName: 'dailyuse-api',
      timeoutMs: 5_000,
    });

    const chunks: Array<{ content: string; finishReason?: string }> = [];
    for await (const chunk of adapter.stream({
      identityId: 'identity-1',
      requestId: 'request-1',
      messages: [{ role: 'user', content: '1+1' }],
      providerConfig: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        apiKey: 'provider-key',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        temperature: 0.7,
      },
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([{ content: '2', finishReason: 'stop' }]);
  });
});
