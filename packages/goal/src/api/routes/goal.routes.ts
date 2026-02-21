/**
 * Goal CRUD & Status Routes
 *
 * 目标的增删改查和状态操作路由。
 * 从 contracts 导入 response schemas，不在本地定义。
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
  CreateGoalSchema,
  UpdateGoalSchema,
  QueryGoalsSchema,
  GoalClientDTOSchema,
  QueryGoalsResSchema,
  type CreateGoalReq,
  type UpdateGoalReq,
} from '@dailyuse/contracts/goal';
import type { GoalController } from '../../controllers/goal.controller';

// ============ Helpers ============

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerGoalCrudRoutes(
  controller: GoalController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // ==================== Goal CRUD ====================

  // POST / — 创建目标
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建目标',
      request: { body: { content: { 'application/json': { schema: CreateGoalSchema } } } },
      responses: {
        201: successResponse(GoalClientDTOSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body as CreateGoalReq, ctx),
    { successStatus: 201 },
  );

  // GET / — 查询目标列表
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取目标列表',
      request: { query: QueryGoalsSchema },
      responses: {
        200: successResponse(QueryGoalsResSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.list({
      identityId: ctx.identityId,
      status: parseStringArray(req.query?.status),
      importance: parseStringArray(req.query?.importance) as any,
      category: req.query?.category as string | undefined,
      tags: parseStringArray(req.query?.tags),
      folderId: req.query?.folderId as string | undefined,
      keyword: req.query?.keyword as string | undefined,
      startDate: parseNumber(req.query?.startDate),
      endDate: parseNumber(req.query?.endDate),
      sortBy: req.query?.sortBy as 'createdAt' | 'updatedAt' | 'targetDate' | 'priority' | undefined,
      sortOrder: req.query?.sortOrder as 'asc' | 'desc' | undefined,
      page: parseNumber(req.query?.page),
      pageSize: parseNumber(req.query?.pageSize),
      includeKeyResults: parseBoolean(req.query?.includeKeyResults),
      includeReviews: parseBoolean(req.query?.includeReviews),
    }),
  );

  // GET /search — 搜索目标
  r.route(
    {
      method: 'get',
      path: '/search',
      summary: '搜索目标',
      request: { query: z.object({ keyword: z.string().optional(), status: z.string().optional() }) },
      responses: {
        200: successResponse(z.array(GoalClientDTOSchema), '搜索成功'),
      },
    },
    [auth],
    (req, ctx) => controller.search(
      typeof req.query?.q === 'string' ? req.query.q : '',
      ctx,
    ),
  );

  // GET /:id — 获取目标详情
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取目标详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '获取成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.get(req.params!.id, parseBoolean(req.query?.includeChildren) ?? true),
    { requireAuth: false },
  );

  // PUT /:id — 更新目标
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新目标',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateGoalSchema } } },
      },
      responses: {
        200: successResponse(GoalClientDTOSchema, '更新成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body as UpdateGoalReq),
  );

  // PATCH /:id — 更新目标（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body as UpdateGoalReq),
  );

  // DELETE /:id — 删除目标（软删除）
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除目标',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.delete(req.params!.id),
  );

  // ==================== Goal Status Operations ====================

  // POST /:id/archive — 归档目标
  r.route(
    {
      method: 'post',
      path: '/:id/archive',
      summary: '归档目标',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '归档成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.archive(req.params!.id),
  );

  // POST /:id/activate — 激活目标
  r.route(
    {
      method: 'post',
      path: '/:id/activate',
      summary: '激活目标',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '激活成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.activate(req.params!.id),
  );

  return router;
}
