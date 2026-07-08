/**
 * Standalone Resource Routes
 *
 * 独立的资源路由（不嵌套在仓库下）。
 * Mounted at /resources by the module.
 *
 * Routes:
 *   GET    /:id    — Get resource by ID
 *   PUT    /:id    — Update resource
 *   DELETE /:id    — Delete resource
 */

import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import { UpdateResourceSchema, ResourceResponseSchema } from '@dailyuse/contracts/repository';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { ResourceId } from '@dailyuse/contracts/primitives';
import type { RepositoryController } from '../../server/transport/repository.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerStandaloneResourceRoutes(
  controller: RepositoryController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/resources',
    defaultTags: ['Resource'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // GET /:id — Get resource by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取资源详情',
      request: { params: z.object({ id: brandedId<ResourceId>() }) },
      responses: {
        200: successResponse(ResourceResponseSchema, '获取成功'),
        404: errorResponse('资源不存在'),
      },
    },
    [auth],
    (req) => controller.getResource(req.params!.id),
  );

  // PUT /:id — Update resource
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新资源',
      request: {
        params: z.object({ id: brandedId<ResourceId>() }),
        body: { content: { 'application/json': { schema: UpdateResourceSchema } } },
      },
      responses: {
        200: successResponse(ResourceResponseSchema, '更新成功'),
        404: errorResponse('资源不存在'),
      },
    },
    [auth],
    (req) => controller.updateResource(req.params!.id, req.body),
  );

  // DELETE /:id — Delete resource
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除资源',
      request: { params: z.object({ id: brandedId<ResourceId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('资源不存在'),
      },
    },
    [auth],
    (req) => controller.deleteResource(req.params!.id),
  );

  return router;
}
