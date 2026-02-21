/**
 * Repository CRUD Routes
 *
 * 仓库的增删改查及归档/激活操作，以及嵌套的资源路由。
 *
 * Routes:
 *   POST   /                    — Create repository
 *   GET    /                    — List repositories
 *   GET    /:id                 — Get repository by ID
 *   PUT    /:id                 — Update repository
 *   DELETE /:id                 — Delete repository
 *   POST   /:id/archive         — Archive repository
 *   POST   /:id/activate        — Activate repository
 *   POST   /:repoId/resources   — Create resource (nested)
 *   GET    /:repoId/resources   — List resources (nested)
 */

import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateRepositorySchema,
  UpdateRepositorySchema,
  CreateResourceSchema,
  RepositoryResponseSchema,
  ResourceResponseSchema,
} from '@dailyuse/contracts/repository';
import type { RepositoryController } from '../../controllers/repository.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerRepositoryCrudRoutes(
  controller: RepositoryController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/repositories',
    defaultTags: ['Repository'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — Create repository
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建仓库',
      request: { body: { content: { 'application/json': { schema: CreateRepositorySchema } } } },
      responses: {
        201: successResponse(RepositoryResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createRepository(req.body, ctx),
    { successStatus: 201 },
  );

  // GET / — List repositories
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取仓库列表',
      request: {
        query: z.object({
          status: z.string().optional(),
          type: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(RepositoryResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listRepositories({
      status: typeof req.query?.status === 'string' ? req.query.status : undefined,
      type: typeof req.query?.type === 'string' ? req.query.type : undefined,
    }, ctx),
  );

  // GET /:id — Get repository by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取仓库详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(RepositoryResponseSchema, '获取成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.getRepository(req.params!.id),
  );

  // PUT /:id — Update repository
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新仓库',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateRepositorySchema } } },
      },
      responses: {
        200: successResponse(RepositoryResponseSchema, '更新成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.updateRepository(req.params!.id, req.body),
  );

  // DELETE /:id — Delete repository
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除仓库',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.deleteRepository(req.params!.id),
  );

  // POST /:id/archive — Archive repository
  r.route(
    {
      method: 'post',
      path: '/:id/archive',
      summary: '归档仓库',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(RepositoryResponseSchema, '归档成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.archiveRepository(req.params!.id),
  );

  // POST /:id/activate — Activate repository
  r.route(
    {
      method: 'post',
      path: '/:id/activate',
      summary: '激活仓库',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(RepositoryResponseSchema, '激活成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.activateRepository(req.params!.id),
  );

  // ── Nested Resource Routes ───────────────────────────────────────

  // POST /:repoId/resources — Create resource
  r.route(
    {
      method: 'post',
      path: '/:repoId/resources',
      summary: '创建资源',
      request: {
        params: z.object({ repoId: z.string().uuid() }),
        body: { content: { 'application/json': { schema: CreateResourceSchema } } },
      },
      responses: {
        201: successResponse(ResourceResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) => controller.createResource(req.params!.repoId, req.body),
    { successStatus: 201 },
  );

  // GET /:repoId/resources — List resources
  r.route(
    {
      method: 'get',
      path: '/:repoId/resources',
      summary: '获取资源列表',
      request: {
        params: z.object({ repoId: z.string().uuid() }),
        query: z.object({
          folderId: z.string().uuid().optional(),
          status: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(ResourceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req) => controller.listResources(req.params!.repoId, {
      folderId: typeof req.query?.folderId === 'string' ? req.query.folderId : undefined,
      status: typeof req.query?.status === 'string' ? req.query.status : undefined,
    }),
  );

  return router;
}
