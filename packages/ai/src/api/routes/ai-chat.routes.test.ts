import { EventEmitter } from 'node:events';
import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { AIChatController } from '../controllers/ai-chat.controller';
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
  });

  it('aborts stream processing when request connection closes', async () => {
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
    expect(capturedSignal?.aborted).toBe(true);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(0);
  });
});
