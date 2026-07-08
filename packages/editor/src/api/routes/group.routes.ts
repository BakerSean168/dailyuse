import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateEditorGroupSchema,
  UpdateEditorGroupSchema,
  GroupResponseSchema,
  DeleteEditorGroupParamsSchema,
} from '@dailyuse/contracts/editor';
import type { EditorController } from '../../server/transport/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerGroupRoutes(
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
      path: '/groups',
      summary: '创建分组',
      request: {
        body: { content: { 'application/json': { schema: CreateEditorGroupSchema } } },
      },
      responses: {
        201: successResponse(GroupResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createGroup(req.body, ctx),
    { successStatus: 201 },
  );

  r.route(
    {
      method: 'put',
      path: '/groups/:id',
      summary: '更新分组',
      request: {
        params: z.object({ id: z.string().min(1) }),
        body: { content: { 'application/json': { schema: UpdateEditorGroupSchema } } },
      },
      responses: {
        200: successResponse(GroupResponseSchema, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updateGroup(req.params!.id, req.body, ctx),
  );

  r.route(
    {
      method: 'delete',
      path: '/workspaces/:workspaceId/sessions/:sessionId/groups/:groupId',
      summary: '删除分组',
      request: { params: DeleteEditorGroupParamsSchema },
      responses: {
        200: successResponse(z.null(), '删除成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.deleteGroup(req.params!.workspaceId, req.params!.sessionId, req.params!.groupId, ctx),
  );

  return router;
}
