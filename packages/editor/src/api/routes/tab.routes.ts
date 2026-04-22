import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateEditorTabSchema,
  UpdateEditorTabSchema,
  TabResponseSchema,
  ActivateEditorTabParamsSchema,
  DeleteEditorTabParamsSchema,
} from '@dailyuse/contracts/editor';
import type { EditorController } from '../../controllers/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerTabRoutes(
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
      path: '/tabs',
      summary: '创建标签页',
      request: {
        body: { content: { 'application/json': { schema: CreateEditorTabSchema } } },
      },
      responses: {
        201: successResponse(TabResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createTab(req.body, ctx),
    { successStatus: 201 },
  );

  r.route(
    {
      method: 'put',
      path: '/tabs/:id',
      summary: '更新标签页',
      request: {
        params: z.object({ id: z.string().min(1) }),
        body: { content: { 'application/json': { schema: UpdateEditorTabSchema } } },
      },
      responses: {
        200: successResponse(TabResponseSchema, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updateTab(req.params!.id, req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/workspaces/:workspaceId/sessions/:sessionId/groups/:groupId/tabs/:tabId/activate',
      summary: '激活标签页',
      request: { params: ActivateEditorTabParamsSchema },
      responses: {
        200: successResponse(z.null(), '激活成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.activateTab(
        req.params!.workspaceId,
        req.params!.sessionId,
        req.params!.groupId,
        req.params!.tabId,
        ctx,
      ),
  );

  r.route(
    {
      method: 'delete',
      path: '/workspaces/:workspaceId/sessions/:sessionId/groups/:groupId/tabs/:tabId',
      summary: '删除标签页',
      request: { params: DeleteEditorTabParamsSchema },
      responses: {
        200: successResponse(z.null(), '删除成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.deleteTab(
        req.params!.workspaceId,
        req.params!.sessionId,
        req.params!.groupId,
        req.params!.tabId,
        ctx,
      ),
  );

  return router;
}
