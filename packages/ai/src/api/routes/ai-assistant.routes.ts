/**
 * AssistantFacade HTTP routes (residual 345).
 * POST /api/v1/ai/assistant/dispatch/sse — stream AssistantEvent over SSE.
 *
 * Framing is frozen in plan §4.4:
 * - `event: assistant` + `data: AssistantEvent` per Host event
 * - `event: error` + `data: { code, message, details? }` exactly once on failure
 * - `event: done` + `data: AssistantDispatchResult` exactly once on success
 *
 * Lifecycle invariants:
 * - A request abort or response close aborts the controller, removes the
 *   listeners and never writes a terminal frame (no fake success after abort).
 * - `identityId` comes from the authenticated `req.user` only; a missing
 *   identity answers 401 JSON BEFORE the SSE headers are written.
 *
 * AssistantFacade HTTP 路由（residual 345）。
 * POST /api/v1/ai/assistant/dispatch/sse —— 以 SSE 流式返回 AssistantEvent。
 *
 * 帧格式按计划 §4.4 冻结：
 * - `event: assistant` + `data: AssistantEvent`：每个 Host 事件一帧
 * - `event: error` + `data: { code, message, details? }`：失败时恰好一帧
 * - `event: done` + `data: AssistantDispatchResult`：成功时恰好一帧
 *
 * 生命周期不变量：
 * - request abort 或 response close 时中止 controller、移除监听器，并且绝不写
 *   终态帧（abort 后不得补发成功 terminal）。
 * - `identityId` 只来自认证后的 `req.user`；identity 缺失时在写 SSE headers
 *   之前直接返回 401 JSON。
 */
import { Router, type Request, type RequestHandler } from 'express';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { createHttpResponseBuilder } from '@memoflow/utils/result';
import type { AIAssistantFacadeController } from '../../server/transport/ai-assistant-facade.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIAssistantRoutes(
  controller: AIAssistantFacadeController,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  router.post('/dispatch/sse', auth, async (req, res) => {
    const requestWithMeta = req as Request & { traceId?: string; id?: string };
    const responseBuilder = createHttpResponseBuilder({
      traceId: requestWithMeta.traceId ?? requestWithMeta.id,
      startTime: Date.now(),
    });
    const identityId = (req as Request & { user?: { identityId?: string } }).user?.identityId;
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const streamAbortController = new AbortController();
    let connectionClosed = false;
    const handleConnectionClosed = () => {
      connectionClosed = true;
      streamAbortController.abort();
    };

    req.on('aborted', handleConnectionClosed);
    res.on('close', handleConnectionClosed);

    const writeSseEvent = (event: 'assistant' | 'error' | 'done', data: unknown): boolean => {
      if (connectionClosed || res.writableEnded) {
        return false;
      }
      try {
        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${event}\ndata: ${serialized}\n\n`);
        return true;
      } catch {
        handleConnectionClosed();
        return false;
      }
    };

    try {
      const result = await controller.dispatch(
        req.body,
        { identityId } as ExecutionContext,
        {
          onEvent: (assistantEvent) => {
            if (!writeSseEvent('assistant', assistantEvent)) {
              handleConnectionClosed();
            }
          },
        },
        streamAbortController.signal,
      );

      if (connectionClosed || res.writableEnded) {
        return;
      }

      if (!result.ok) {
        writeSseEvent('error', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
        });
        return;
      }

      writeSseEvent('done', result.data);
    } catch (error) {
      if (!connectionClosed && !streamAbortController.signal.aborted) {
        writeSseEvent('error', {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Assistant dispatch failed',
        });
      }
    } finally {
      req.removeListener('aborted', handleConnectionClosed);
      res.removeListener('close', handleConnectionClosed);
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  return router;
}
