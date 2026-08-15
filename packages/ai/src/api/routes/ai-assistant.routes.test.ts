/**
 * registerAIAssistantRoutes behavior spec (residual 345 / plan Step A §5.1).
 *
 * Locks the SSE route contract: 401 JSON before any SSE header, frozen
 * `assistant/error/done` framing, single terminal frame, abort/close semantics,
 * listener cleanup and write-failure handling.
 *
 * registerAIAssistantRoutes 行为测试（residual 345 / 计划 Step A §5.1）。
 *
 * 锁定 SSE 路由契约：写 SSE headers 之前先返回 401 JSON、冻结的
 * `assistant/error/done` 帧格式、唯一终态帧、abort/close 语义、监听器清理与
 * 写失败处理。
 */
import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@memoflow/contracts/result';
import type { AIAssistantFacadeController } from '../../server/transport/ai-assistant-facade.controller';
import { registerAIAssistantRoutes } from './ai-assistant.routes';

type LayerWithRoute = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (req: any, res: any) => unknown }>;
  };
};

function getRouteHandler(router: Router, method: string, path: string) {
  const layer = (router as unknown as { stack: LayerWithRoute[] }).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()] === true,
  );
  expect(layer?.route).toBeDefined();
  return layer!.route!.stack.at(-1)!.handle;
}

function createMockRes() {
  const listeners: Record<string, Array<() => void>> = {};
  let writableEnded = false;
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    written: [] as string[],
    setHeader: vi.fn((name: string, value: string) => {
      res.headers[name] = value;
    }),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => {
      res.written.push(chunk);
      return true;
    }),
    end: vi.fn(() => {
      writableEnded = true;
    }),
    on: vi.fn((event: string, cb: () => void) => {
      (listeners[event] ??= []).push(cb);
    }),
    removeListener: vi.fn(),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn(),
  };
  Object.defineProperty(res, 'writableEnded', {
    get: () => writableEnded,
    set: () => undefined,
  });
  return {
    res,
    listeners,
    emitClose: () => {
      for (const cb of listeners.close ?? []) {
        cb();
      }
    },
  };
}

function createMockReq(body: unknown, identityId?: string) {
  const listeners: Record<string, Array<() => void>> = {};
  const req = {
    body,
    user: identityId ? { identityId } : undefined,
    traceId: 'trace-assistant-1',
    on: vi.fn((event: string, cb: () => void) => {
      (listeners[event] ??= []).push(cb);
    }),
    removeListener: vi.fn(),
  };
  return {
    req,
    listeners,
    emitAborted: () => {
      for (const cb of listeners.aborted ?? []) {
        cb();
      }
    },
  };
}

function createControllerStub() {
  return {
    dispatch: vi.fn(),
  } as unknown as AIAssistantFacadeController;
}

const authMiddleware = ((_: unknown, __: unknown, next: () => void) => next()) as never;

const messageBody = {
  type: 'message',
  conversationId: 'conv-1',
  content: 'hello',
  surface: 'web',
};

function sseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
}

describe('registerAIAssistantRoutes', () => {
  it('answers 401 JSON without starting SSE when identity is missing', async () => {
    const controller = createControllerStub();
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody);
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
    expect(controller.dispatch).not.toHaveBeenCalled();
  });

  it('locks the frozen SSE headers before streaming', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockResolvedValue(ok({ eventCount: 0 }));
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(res.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    expect(res.flushHeaders).toHaveBeenCalled();
  });

  it('streams assistant frames in order and a single done frame', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockImplementation(
      async (_input: unknown, _cx: unknown, handlers: { onEvent?: (e: unknown) => void }) => {
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        handlers.onEvent?.({
          type: 'message.delta',
          runId: 'run-1',
          content: 'delta',
        });
        return ok({ eventCount: 2 });
      },
    );
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(res.written).toEqual([
      sseFrame('assistant', {
        type: 'run.started',
        runId: 'run-1',
        engineId: 'engine.direct_turn',
        profile: 'direct_turn',
      }),
      sseFrame('assistant', { type: 'message.delta', runId: 'run-1', content: 'delta' }),
      sseFrame('done', { eventCount: 2 }),
    ]);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('writes exactly one transport error on a Result failure and no done', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockResolvedValue(fail({ code: 'NOT_FOUND', message: 'missing route' }));
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(res.written).toEqual([
      sseFrame('error', { code: 'NOT_FOUND', message: 'missing route' }),
    ]);
    expect(res.written.join('')).not.toContain('event: done');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('writes an INTERNAL_ERROR frame when the controller throws', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockRejectedValue(new Error('boom'));
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(res.written).toEqual([
      sseFrame('error', { code: 'INTERNAL_ERROR', message: 'boom' }),
    ]);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('aborts the controller, writes no terminal frame and ends safely when the request aborts', async () => {
    const controller = createControllerStub();
    const seenSignal: AbortSignal[] = [];
    controller.dispatch.mockImplementation(
      async (
        _input: unknown,
        _cx: unknown,
        handlers: { onEvent?: (e: unknown) => void },
        signal?: AbortSignal,
      ) => {
        seenSignal.push(signal as AbortSignal);
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        return ok({ eventCount: 1 });
      },
    );
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req, emitAborted } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    const promise = handler(req as never, res as never);
    emitAborted();
    await promise;

    expect(seenSignal[0].aborted).toBe(true);
    expect(res.written.join('')).not.toContain('event: done');
    expect(res.written.join('')).not.toContain('event: error');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('aborts the controller and writes no terminal frame on response close', async () => {
    const controller = createControllerStub();
    const seenSignal: AbortSignal[] = [];
    controller.dispatch.mockImplementation(
      async (
        _input: unknown,
        _cx: unknown,
        handlers: { onEvent?: (e: unknown) => void },
        signal?: AbortSignal,
      ) => {
        seenSignal.push(signal as AbortSignal);
        handlers.onEvent?.({
          type: 'message.delta',
          runId: 'run-1',
          content: 'd',
        });
        return ok({ eventCount: 1 });
      },
    );
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res, emitClose } = createMockRes();

    const promise = handler(req as never, res as never);
    emitClose();
    await promise;

    expect(seenSignal[0].aborted).toBe(true);
    expect(res.written.join('')).not.toContain('event: done');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('removes aborted and close listeners after the response completes', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockResolvedValue(ok({ eventCount: 0 }));
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(req.removeListener).toHaveBeenCalledWith('aborted', expect.any(Function));
    expect(res.removeListener).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('treats a failing write as a closed connection with no terminal frame', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockImplementation(
      async (_input: unknown, _cx: unknown, handlers: { onEvent?: (e: unknown) => void }) => {
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        return ok({ eventCount: 1 });
      },
    );
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();
    res.write.mockImplementation(() => {
      throw new Error('socket closed');
    });

    await handler(req as never, res as never);

    expect(res.written.join('')).not.toContain('event: done');
    expect(res.written.join('')).not.toContain('event: error');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('forwards the body, trusted identity and an abortable signal to the controller', async () => {
    const controller = createControllerStub();
    controller.dispatch.mockImplementation(
      async (
        input: unknown,
        cx: unknown,
        handlers: unknown,
        signal: unknown,
      ) => {
        expect(input).toEqual(messageBody);
        expect(cx).toMatchObject({ identityId: 'user-1' });
        expect(handlers).toMatchObject({
          onEvent: expect.any(Function),
        });
        expect(signal).toBeInstanceOf(AbortSignal);
        return ok({ eventCount: 0 });
      },
    );
    const router = registerAIAssistantRoutes(controller, { auth: authMiddleware });
    const handler = getRouteHandler(router, 'post', '/dispatch/sse');
    const { req } = createMockReq(messageBody, 'user-1');
    const { res } = createMockRes();

    await handler(req as never, res as never);

    expect(controller.dispatch).toHaveBeenCalledTimes(1);
  });
});
