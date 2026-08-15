/**
 * AIServiceInternalClient Spec — RefArch Phase 2 request-ID propagation.
 * 覆盖 outbound `X-Request-Id` 的精确透传、UUID fallback、HMAC 不变，
 * 以及 abort/timeout/error 携带同一 resolved request ID。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AIServiceInternalClient,
  INTERNAL_CONTENT_HASH_HEADER,
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
} from '..';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createClient(
  options: Partial<ConstructorParameters<typeof AIServiceInternalClient>[0]> = {},
) {
  return new AIServiceInternalClient({
    baseUrl: 'http://127.0.0.1:8100',
    serviceSecret: 'shared-secret',
    serviceName: 'memoflow-api',
    timeoutMs: 5_000,
    ...options,
  });
}

function okResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('AIServiceInternalClient (RefArch Phase 2 request-ID propagation)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards the provided requestId verbatim as X-Request-Id on POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    await client.postJson({
      path: '/internal/chat',
      identityId: 'identity-1',
      body: { q: 'x' },
      requestId: 'entry-req-123',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toBe('entry-req-123');
  });

  it('forwards the provided requestId verbatim as X-Request-Id on GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    await client.getJson({
      path: '/internal/status',
      identityId: 'identity-1',
      requestId: 'entry-req-456',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toBe('entry-req-456');
  });

  it('generates exactly one fallback UUID when no requestId is provided (single value everywhere)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    await client.postJson({ path: '/internal/chat', identityId: 'identity-1', body: {} });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toMatch(UUID_PATTERN);
  });

  it('keeps HMAC canonical headers unchanged (signature over method/path/timestamp/body)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    const body = JSON.stringify({ q: 'x' });
    await client.postJson({
      path: '/internal/chat',
      identityId: 'identity-1',
      body: JSON.parse(body),
      requestId: 'entry-req-1',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers[INTERNAL_SERVICE_HEADER]).toBe('memoflow-api');
    expect(headers[INTERNAL_TIMESTAMP_HEADER]).toMatch(/^\d+$/);
    expect(headers[INTERNAL_CONTENT_HASH_HEADER]).toMatch(/^[0-9a-f]{64}$/);
    expect(headers[INTERNAL_SIGNATURE_HEADER]).toMatch(/^[0-9a-f]{64}$/);
    expect(headers['X-Identity-Id']).toBe('identity-1');
    expect(url).toContain('/internal/chat');
  });

  it('uses the same resolved requestId in the structured error for non-2xx responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('upstream boom', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    await expect(
      client.postJson({
        path: '/internal/chat',
        identityId: 'identity-1',
        body: {},
        requestId: 'entry-req-500',
      }),
    ).rejects.toMatchObject({
      name: 'AIServiceInternalRequestError',
      requestId: 'entry-req-500',
      category: 'upstream_provider_error',
      statusCode: 502,
    });
  });

  it('uses the resolved requestId in the structured error for aborted/timeout requests', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    await expect(
      client.postJson({
        path: '/internal/chat',
        identityId: 'identity-1',
        body: {},
        requestId: 'entry-req-abort',
      }),
    ).rejects.toMatchObject({
      name: 'AIServiceInternalRequestError',
      requestId: 'entry-req-abort',
    });
  });

  it('supports SSE streaming via postStream with the same requestId header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode('event: message\ndata: hi\n\n'));
            c.close();
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createClient();
    const response = await client.postStream({
      path: '/internal/chat/stream',
      identityId: 'identity-1',
      body: {},
      requestId: 'entry-req-sse',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toBe('entry-req-sse');
    expect(response.status).toBe(200);
  });
});
