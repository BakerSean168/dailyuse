import { z } from 'zod';
import { Router, type Request, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  createHttpResponseBuilder,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateConversationSchema,
  UpdateConversationSchema,
  SendMessageSchema,
  ListMessagesSchema,
} from '@dailyuse/contracts/ai';
import type { AIChatController } from '../controllers/ai-chat.controller';

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
      request: { body: { content: { 'application/json': { schema: CreateConversationSchema } } } },
      responses: {
        201: successResponse(z.any(), '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createConversation(req.body, ctx.identityId),
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
        200: successResponse(z.any(), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listConversations(
        ctx.identityId,
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
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: successResponse(z.any(), '获取成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req) => controller.getConversation(req.params!.id),
  );

  // PATCH /conversations/:id — Update conversation
  r.route(
    {
      method: 'patch',
      path: '/conversations/:id',
      summary: '更新 AI 对话',
      request: {
        params: z.object({ id: z.string() }),
        body: { content: { 'application/json': { schema: UpdateConversationSchema } } },
      },
      responses: {
        200: successResponse(z.any(), '更新成功'),
        400: errorResponse('参数错误'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req) => controller.updateConversation(req.params!.id, req.body),
  );

  // DELETE /conversations/:id — Delete conversation
  r.route(
    {
      method: 'delete',
      path: '/conversations/:id',
      summary: '删除 AI 对话',
      request: {
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: successResponse(z.object({}), '删除成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req) => controller.deleteConversation(req.params!.id),
  );

  // POST /messages — Send message
  r.route(
    {
      method: 'post',
      path: '/messages',
      summary: '发送 AI 消息',
      request: { body: { content: { 'application/json': { schema: SendMessageSchema } } } },
      responses: {
        201: successResponse(z.any(), '发送成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.sendMessage(req.body, ctx.identityId),
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
        200: successResponse(z.any(), '获取成功'),
      },
    },
    [auth],
    (req) => controller.listMessages(req.query),
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

    try {
      const result = await controller.streamMessage(
        req.body,
        identityId,
        (chunk) => {
          res.write(
            `event: message\ndata: ${JSON.stringify({
              role: chunk.role,
              content: chunk.content,
            })}\n\n`,
          );
        },
      );

      if (!result.ok) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
          })}\n\n`,
        );
        return;
      }

      res.write(`event: done\ndata: ${JSON.stringify(result.data)}\n\n`);
    } catch (error) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'AI stream failed',
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  });

  return router;
}
