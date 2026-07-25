import { z } from 'zod';
import { Router, type Request, type RequestHandler } from 'express';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  createHttpResponseBuilder,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  ConversationNameSchema,
  SendMessageSchema,
  ListMessagesSchema,
  AIConversationClientDTOSchema,
  SendMessageResSchema,
  ConversationListResSchema,
  MessageListResSchema,
} from '@dailyuse/contracts/ai';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { AiConversationId } from '@dailyuse/contracts/primitives';
import type { AIChatController } from '../../server/transport/ai-chat.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIChatRoutes(
  controller: AIChatController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/ai/chat',
    defaultTags: ['AI Chat'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /conversations — Create conversation
  r.route(
    {
      method: 'post',
      path: '/conversations',
      summary: '创建 AI 对话',
      request: { body: { content: { 'application/json': { schema: ConversationNameSchema } } } },
      responses: {
        201: successResponse(AIConversationClientDTOSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createConversation(req.body, { identityId: ctx.identityId } as ExecutionContext),
    { successStatus: 201 },
  );

  // GET /conversations — List conversations
  r.route(
    {
      method: 'get',
      path: '/conversations',
      summary: '获取 AI 对话列表',
      request: {
        query: z.object({
          page: z.string().optional(),
          pageSize: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(ConversationListResSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listConversations(
        { identityId: ctx.identityId } as ExecutionContext,
        Number(req.query?.page ?? 1),
        Number(req.query?.pageSize ?? 20),
      ),
  );

  // GET /conversations/:id — Get conversation
  r.route(
    {
      method: 'get',
      path: '/conversations/:id',
      summary: '获取 AI 对话详情',
      request: {
        params: z.object({ id: brandedId<AiConversationId>() }),
      },
      responses: {
        200: successResponse(AIConversationClientDTOSchema, '获取成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req, ctx) => controller.getConversation(req.params!.id, { identityId: ctx.identityId } as ExecutionContext),
  );

  // PATCH /conversations/:id — Update conversation
  r.route(
    {
      method: 'patch',
      path: '/conversations/:id',
      summary: '更新 AI 对话',
      request: {
        params: z.object({ id: brandedId<AiConversationId>() }),
        body: { content: { 'application/json': { schema: ConversationNameSchema } } },
      },
      responses: {
        200: successResponse(AIConversationClientDTOSchema, '更新成功'),
        400: errorResponse('参数错误'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req, ctx) => controller.updateConversation(req.params!.id, req.body, { identityId: ctx.identityId } as ExecutionContext),
  );

  // DELETE /conversations/:id — Delete conversation
  r.route(
    {
      method: 'delete',
      path: '/conversations/:id',
      summary: '删除 AI 对话',
      request: {
        params: z.object({ id: brandedId<AiConversationId>() }),
      },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteConversation(req.params!.id, { identityId: ctx.identityId } as ExecutionContext),
  );

  // POST /messages — Send message
  r.route(
    {
      method: 'post',
      path: '/messages',
      summary: '发送 AI 消息',
      request: { body: { content: { 'application/json': { schema: SendMessageSchema } } } },
      responses: {
        201: successResponse(SendMessageResSchema, '发送成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.sendMessage(req.body, { identityId: ctx.identityId } as ExecutionContext),
    { successStatus: 201 },
  );

  // GET /messages — List messages
  r.route(
    {
      method: 'get',
      path: '/messages',
      summary: '获取 AI 消息列表',
      request: {
        query: ListMessagesSchema,
      },
      responses: {
        200: successResponse(MessageListResSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listMessages(req.query, { identityId: ctx.identityId } as ExecutionContext),
  );

  router.post('/messages/sse', auth, async (req, res) => {
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

    const writeSseEvent = (
      event: 'message' | 'error' | 'done',
      data: unknown,
    ): boolean => {
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
      const result = await controller.streamMessage(
        req.body,
        { identityId } as ExecutionContext,
        (chunk) => {
          writeSseEvent('message', {
            role: chunk.role,
            content: chunk.content,
          });
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
          message: error instanceof Error ? error.message : 'AI stream failed',
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
