/**
 * Goal API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与请求处理 + OpenAPI 文档在同一处注册，
 * 消除"双重记账"问题（路由路径、方法、参数只写一次）。
 *
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 *
 * Routes:
 *   POST   /goals              — 创建目标
 *   GET    /goals              — 查询目标列表
 *   GET    /goals/search       — 搜索目标
 *   GET    /goals/:id          — 获取目标详情
 *   PUT    /goals/:id          — 更新目标
 *   DELETE /goals/:id          — 删除目标（软删除）
 *   POST   /goals/:id/archive  — 归档目标
 *   POST   /goals/:id/activate — 激活目标
 *   POST   /goals/:id/complete — 完成目标 (TODO)
 *
 *   POST   /goals/:id/key-results              — 添加关键结果
 *   PUT    /goals/:id/key-results/:krId         — 更新关键结果
 *   PATCH  /goals/:id/key-results/:krId/progress — 更新关键结果进度
 *   DELETE /goals/:id/key-results/:krId         — 删除关键结果
 *
 *   POST   /goals/:id/reviews  — 添加目标回顾
 */

import { z } from 'zod';
import { Router } from 'express';
import type { RequestHandler } from 'express';
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
  AddKeyResultSchema,
  UpdateKeyResultSchema,
  UpdateKeyResultProgressSchema,
  CreateGoalReviewSchema,
} from '@dailyuse/contracts/goal';
import { GoalController } from '../controllers/goal.controller';
import type { GoalUseCases } from '../controllers/goal.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

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

// ============ Response Schemas ============

const GoalResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  importance: z.string(),
  progress: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ============ Route Registration ============

export function registerGoalRoutes(
  handlers: GoalUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new GoalController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // Register OpenAPI component schemas
  r.registerSchema('Goal', GoalResponseSchema);
  r.registerSchema('CreateGoal', CreateGoalSchema);
  r.registerSchema('UpdateGoal', UpdateGoalSchema);

  // ==================== Goal CRUD ====================

  // POST / — 创建目标
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建目标',
      request: { body: { content: { 'application/json': { schema: CreateGoalSchema } } } },
      responses: {
        201: successResponse(GoalResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body, ctx),
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
        200: successResponse(z.array(GoalResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.list({
      identityId: ctx.identityId,
      status: parseStringArray(req.query?.status),
      importance: parseStringArray(req.query?.importance),
      category: req.query?.category,
      tags: parseStringArray(req.query?.tags),
      folderId: req.query?.folderId,
      keyword: req.query?.keyword,
      startDate: parseNumber(req.query?.startDate),
      endDate: parseNumber(req.query?.endDate),
      sortBy: req.query?.sortBy,
      sortOrder: req.query?.sortOrder,
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
        200: successResponse(z.array(GoalResponseSchema), '搜索成功'),
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
        200: successResponse(GoalResponseSchema, '获取成功'),
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
        200: successResponse(GoalResponseSchema, '更新成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body),
  );

  // PATCH /:id — 更新目标（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body),
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
        200: successResponse(GoalResponseSchema, '归档成功'),
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
        200: successResponse(GoalResponseSchema, '激活成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.activate(req.params!.id),
  );

  // ==================== Key Result Routes ====================

  // POST /:id/key-results — 添加关键结果
  r.route(
    {
      method: 'post',
      path: '/:id/key-results',
      summary: '添加关键结果',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: AddKeyResultSchema } } },
      },
      responses: {
        201: successResponse(z.object({ id: z.string().uuid() }), '添加成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.addKeyResult(req.params!.id, req.body),
    { successStatus: 201 },
  );

  // PUT /:id/key-results/:krId — 更新关键结果
  r.route(
    {
      method: 'put',
      path: '/:id/key-results/:krId',
      summary: '更新关键结果',
      request: {
        params: z.object({ id: z.string().uuid(), krId: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateKeyResultSchema } } },
      },
      responses: {
        200: successResponse(z.object({ id: z.string().uuid() }), '更新成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req) => controller.updateKeyResult(req.params!.id, req.params!.krId, req.body),
  );

  // PATCH /:id/key-results/:krId/progress — 更新关键结果进度
  r.route(
    {
      method: 'patch',
      path: '/:id/key-results/:krId/progress',
      summary: '更新关键结果进度',
      request: {
        params: z.object({ id: z.string().uuid(), krId: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateKeyResultProgressSchema } } },
      },
      responses: {
        200: successResponse(z.object({ id: z.string().uuid() }), '更新成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req) => controller.updateKeyResultProgress(req.params!.id, req.params!.krId, req.body),
  );

  // DELETE /:id/key-results/:krId — 删除关键结果
  r.route(
    {
      method: 'delete',
      path: '/:id/key-results/:krId',
      summary: '删除关键结果',
      request: {
        params: z.object({ id: z.string().uuid(), krId: z.string().uuid() }),
      },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req) => controller.deleteKeyResult(req.params!.id, req.params!.krId),
  );

  // ==================== Review Routes ====================

  // POST /:id/reviews — 添加目标回顾
  r.route(
    {
      method: 'post',
      path: '/:id/reviews',
      summary: '添加目标复盘',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: CreateGoalReviewSchema } } },
      },
      responses: {
        201: successResponse(z.object({ id: z.string().uuid() }), '添加成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.addReview(req.params!.id, req.body),
    { successStatus: 201 },
  );

  return router;
}
