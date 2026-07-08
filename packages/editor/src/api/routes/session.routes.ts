import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateEditorSessionSchema,
  UpdateEditorSessionSchema,
  SessionResponseSchema,
  ActivateEditorSessionParamsSchema,
} from '@dailyuse/contracts/editor';
import type { EditorController } from '../../server/transport/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerSessionRoutes(
  controller: EditorController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/editor',
    defaultTags: ['Editor'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'post',
      path: '/sessions',
      summary: '创建会话',
      request: {
        body: { content: { 'application/json': { schema: CreateEditorSessionSchema } } },
      },
      responses: {
        201: successResponse(SessionResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createSession(req.body, ctx),
    { successStatus: 201 },
  );

  r.route(
    {
      method: 'get',
      path: '/workspaces/:workspaceId/sessions',
      summary: '获取工作区会话列表',
      request: { params: z.object({ workspaceId: z.string().min(1) }) },
      responses: {
        200: successResponse(z.array(SessionResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listSessions(req.params!.workspaceId, ctx),
  );

  r.route(
    {
      method: 'get',
      path: '/sessions/:id',
      summary: '获取会话详情',
      request: { params: z.object({ id: z.string().min(1) }) },
      responses: {
        200: successResponse(SessionResponseSchema.nullable(), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.getSession(req.params!.id, ctx),
  );

  r.route(
    {
      method: 'put',
      path: '/sessions/:id',
      summary: '更新会话',
      request: {
        params: z.object({ id: z.string().min(1) }),
        body: { content: { 'application/json': { schema: UpdateEditorSessionSchema } } },
      },
      responses: {
        200: successResponse(SessionResponseSchema.nullable(), '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updateSession(req.params!.id, req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/workspaces/:workspaceId/sessions/:sessionId/activate',
      summary: '激活会话',
      request: { params: ActivateEditorSessionParamsSchema },
      responses: {
        200: successResponse(SessionResponseSchema.nullable(), '激活成功'),
      },
    },
    [auth],
    (req, ctx) => controller.activateSession(req.params!.workspaceId, req.params!.sessionId, ctx),
  );

  r.route(
    {
      method: 'delete',
      path: '/sessions/:id',
      summary: '删除会话',
      request: { params: z.object({ id: z.string().min(1) }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteSession(req.params!.id, ctx),
  );

  return router;
}
