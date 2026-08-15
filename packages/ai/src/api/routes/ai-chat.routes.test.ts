import { EventEmitter } from 'node:events';
import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { AIChatController } from '../../server/transport/ai-chat.controller';
import { registerAIChatRoutes } from './ai-chat.routes';

type LayerWithRoute = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (req: any, res: any) => unknown }>;
  };
};

function createControllerStub(): AIChatController {
  return {
    createConversation: vi.fn(),
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    updateConversation: vi.fn(),
    deleteConversation: vi.fn(),
    sendMessage: vi.fn(),
    listMessages: vi.fn(),
    streamMessage: vi.fn(),
    parseSendMessage: vi.fn(),
  } as unknown as AIChatController;
}

function requestContext() {
  return {
    requestId: 'req-chat-sse-1',
    traceId: 'req-chat-sse-1',
    startedAt: 1_700_000_000_000,
    source: 'http',
  };
}

function getRouteHandler(router: Router, method: string, path: string) {
  const layer = (router as unknown as { stack: LayerWithRoute[] }).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()] === true,
  );

  expect(layer?.route).toBeDefined();
  return layer!.route!.stack.at(-1)!.handle;
}

describe('registerAIChatRoutes', () => {
  it('emits structured SSE error payloads with code and details', async () => {
    const controller = createControllerStub();
    vi.mocked(controller.streamMessage).mockResolvedValue({
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: '请求过于频繁',
        details: [{ code: 'RETRY_LATER', message: 'slow down' }],
      },
    } as Awaited<ReturnType<AIChatController['streamMessage']>>);

    const router = registerAIChatRoutes(controller, {
      auth: ((_, __, next) => next()) as any,
    });
    const handler = getRouteHandler(router, 'post', '/messages/sse');

    const writes: string[] = [];
    const req = Object.assign(new EventEmitter(), {
      body: { conversationId: 'conv-1', content: 'hi' },
      user: { identityId: 'identity-1' },
      requestContext: requestContext(),
    });
    const res = Object.assign(new EventEmitter(), {
      writableEnded: false,
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => writes.push(chunk)),
      end: vi.fn(function (this: { writableEnded: boolean }) {
        this.writableEnded = true;
      }),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    });

    await handler(req, res);

    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('event: error');
    expect(writes[0]).toContain('"code":"RATE_LIMITED"');
    expect(writes[0]).toContain('"message":"请求过于频繁"');
    expect(writes[0]).toContain('"details":[{"code":"RETRY_LATER","message":"slow down"}]');
    // SSE framing headers are set by the route before flushHeaders(); the
    // X-Request-Id header is owned by the global RequestContext middleware
    // (verified in the API smoke test).
    const setHeaders = Object.fromEntries(
      (res.setHeader as ReturnType<typeof vi.fn>).mock.calls.map(([k, v]: [string, string]) => [
        k.toLowerCase(),
        v,
      ]),
    );
    expect(setHeaders['content-type']).toBe('text/event-stream');
    expect(setHeaders['cache-control']).toBe('no-cache, no-transform');
    expect(setHeaders['connection']).toBe('keep-alive');
    expect(setHeaders['x-accel-buffering']).toBe('no');
    expect(res.flushHeaders).toHaveBeenCalled();
  });

  it('does not abort stream processing when only the request stream closes', async () => {
    const controller = createControllerStub();
    let capturedSignal: AbortSignal | undefined;

    vi.mocked(controller.streamMessage).mockImplementation(async (_input, _identityId, onChunk, signal) => {
      capturedSignal = signal;
      await Promise.resolve();
      onChunk({ role: 'assistant', content: 'hello' });
      return {
        ok: true,
        data: {
          userMessage: { id: 'user-1', content: 'hi' },
          assistantMessage: { id: 'assistant-1', content: 'hello' },
          tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          providerId: 'provider-1',
          processingTimeMs: 123,
        },
      } as Awaited<ReturnType<AIChatController['streamMessage']>>;
    });

    const router = registerAIChatRoutes(controller, {
      auth: ((_, __, next) => next()) as any,
    });
    const handler = getRouteHandler(router, 'post', '/messages/sse');

    const writes: string[] = [];
    const req = Object.assign(new EventEmitter(), {
      body: { conversationId: 'conv-1', content: 'hi' },
      user: { identityId: 'identity-1' },
      requestContext: requestContext(),
    });
    const res = Object.assign(new EventEmitter(), {
      writableEnded: false,
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => writes.push(chunk)),
      end: vi.fn(function (this: { writableEnded: boolean }) {
        this.writableEnded = true;
      }),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    });

    const pending = handler(req, res);
    req.emit('close');
    await pending;

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);
    expect(writes).toHaveLength(2);
    expect(writes[0]).toContain('event: message');
    expect(writes[1]).toContain('event: done');
  });

  it('aborts stream processing when the response connection closes', async () => {
    const controller = createControllerStub();
    let capturedSignal: AbortSignal | undefined;

    vi.mocked(controller.streamMessage).mockImplementation(async (_input, _identityId, _onChunk, signal) => {
      capturedSignal = signal;
      await new Promise<void>((resolve) => {
        if (!signal || signal.aborted) {
          resolve();
          return;
        }
        signal.addEventListener('abort', () => resolve(), { once: true });
      });

      return {
        ok: false,
        error: {
          code: 'ABORTED',
          message: 'aborted by client',
        },
      } as Awaited<ReturnType<AIChatController['streamMessage']>>;
    });

    const router = registerAIChatRoutes(controller, {
      auth: ((_, __, next) => next()) as any,
    });
    const handler = getRouteHandler(router, 'post', '/messages/sse');

    const writes: string[] = [];
    const req = Object.assign(new EventEmitter(), {
      body: { conversationId: 'conv-1', content: 'hi' },
      user: { identityId: 'identity-1' },
      requestContext: requestContext(),
    });
    const res = Object.assign(new EventEmitter(), {
      writableEnded: false,
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => writes.push(chunk)),
      end: vi.fn(function (this: { writableEnded: boolean }) {
        this.writableEnded = true;
      }),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    });

    const pending = handler(req, res);
    res.emit('close');
    await pending;

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(true);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(0);
  });
});
