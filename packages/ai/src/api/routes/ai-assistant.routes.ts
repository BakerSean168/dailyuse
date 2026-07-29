/**
 * AssistantFacade HTTP routes (residual 345).
 * POST /api/v1/ai/assistant/dispatch/sse — stream AssistantEvent over SSE.
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
        (assistantEvent) => {
          writeSseEvent('assistant', assistantEvent);
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
