import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  SaveEditorContentSchema,
  EditorContentResponseSchema,
} from '@dailyuse/contracts/editor';
import type { EditorController } from '../../controllers/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerContentRoutes(
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
      method: 'get',
      path: '/content/:resourceId',
      summary: '读取资源内容',
      request: { params: z.object({ resourceId: z.string().min(1) }) },
      responses: {
        200: successResponse(EditorContentResponseSchema.nullable(), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.getContent(req.params!.resourceId, ctx),
  );

  r.route(
    {
      method: 'put',
      path: '/content/:resourceId',
      summary: '保存资源内容',
      request: {
        params: z.object({ resourceId: z.string().min(1) }),
        body: { content: { 'application/json': { schema: SaveEditorContentSchema } } },
      },
      responses: {
        200: successResponse(z.null(), '保存成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.saveContent(req.params!.resourceId, req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/content/:resourceId/auto-save',
      summary: '自动保存资源内容',
      request: {
        params: z.object({ resourceId: z.string().min(1) }),
        body: { content: { 'application/json': { schema: SaveEditorContentSchema } } },
      },
      responses: {
        200: successResponse(z.null(), '保存成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.autoSaveContent(req.params!.resourceId, req.body, ctx),
  );

  return router;
}
