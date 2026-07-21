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
  CloneGoalSchema,
  ListGoalFiltersSchema,
  GoalClientDTOSchema,
  QueryGoalsResSchema,
  GetGoalAggregateResSchema,
  ArchiveExpiredResSchema,
  ProgressBreakdownResSchema,
  BatchUpdateKeyResultWeightsReqSchema,
} from '@dailyuse/contracts/goal';
import type { CloneGoalReq, ListGoalFilters } from '@dailyuse/contracts/goal';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { GoalId } from '@dailyuse/contracts/primitives';
import type { GoalController } from '../../server/transport/goal.controller';

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
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

/**
 * Normalize raw Express req.query into a canonical ListGoalFilters object.
 * Resolves aliases: includeChildren → includeKeyResults, limit → pageSize, dirId → folderId.
 * 集中 route 层 query alias 兼容，controller 只接收 canonical shape。
 */
function normalizeGoalListQuery(query: Record<string, unknown>): ListGoalFilters {
  return {
    status: parseStringArray(query.status) as ListGoalFilters['status'],
    systemView: query.systemView as ListGoalFilters['systemView'],
    importance: parseStringArray(query.importance) as ListGoalFilters['importance'],
    category: (query.category as string | undefined) ?? undefined,
    tags: parseStringArray(query.tags),
    folderId: (query.folderId ?? query.dirId) as ListGoalFilters['folderId'],
    query: (query.query as string | undefined) ?? undefined,
    startDate: parseNumber(query.startDate),
    endDate: parseNumber(query.endDate),
    sortBy: query.sortBy as ListGoalFilters['sortBy'],
    sortOrder: query.sortOrder as ListGoalFilters['sortOrder'],
    page: parseNumber(query.page),
    pageSize: parseNumber(query.pageSize) ?? parseNumber(query.limit),
    includeKeyResults:
      parseBoolean(query.includeKeyResults) ?? parseBoolean(query.includeChildren),
    includeReviews: parseBoolean(query.includeReviews),
  };
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
    (req, ctx) => controller.create(req.body, ctx),
    { successStatus: 201 },
  );

  // GET / — 查询目标列表
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取目标列表',
      request: { query: ListGoalFiltersSchema },
      responses: {
        200: successResponse(QueryGoalsResSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.list(normalizeGoalListQuery(req.query as Record<string, unknown>), ctx),
  );

  // GET /search — 搜索目标
  r.route(
    {
      method: 'get',
      path: '/search',
      summary: '搜索目标',
      request: {
        query: z
          .object({
            query: z.string().optional(),
            status: z.string().optional(),
            systemView: z.string().optional(),
          })
          .strict(),
      },
      responses: {
        200: successResponse(QueryGoalsResSchema, '搜索成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.search(
        typeof req.query?.query === 'string' ? req.query.query : '',
        ctx,
        typeof req.query?.systemView === 'string' ? req.query.systemView : undefined,
      ),
  );

  // GET /:id — 获取目标详情
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取目标详情',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '获取成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.get(
        req.params!.id,
        ctx,
        parseBoolean(req.query?.includeChildren) ?? true,
      ),
  );

  // PUT /:id — 更新目标
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新目标',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
        body: { content: { 'application/json': { schema: UpdateGoalSchema } } },
      },
      responses: {
        200: successResponse(GoalClientDTOSchema, '更新成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.update(req.params!.id, req.body, ctx),
  );

  // PATCH /:id — 更新目标（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth],
    (req, ctx) => controller.update(req.params!.id, req.body, ctx),
  );

  // DELETE /:id — 删除目标（软删除）
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除目标',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.delete(req.params!.id, ctx),
  );

  // ==================== Goal Status Operations ====================

  r.route(
    {
      method: 'post',
      path: '/archive-expired',
      summary: '归档所有已过期目标',
      responses: {
        200: successResponse(ArchiveExpiredResSchema, '归档成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.archiveExpired(ctx),
  );

  // POST /:id/archive — 归档目标
  r.route(
    {
      method: 'post',
      path: '/:id/archive',
      summary: '归档目标',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '归档成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.archive(req.params!.id, ctx),
  );

  // POST /:id/activate — 激活目标
  r.route(
    {
      method: 'post',
      path: '/:id/activate',
      summary: '激活目标',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '激活成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.activate(req.params!.id, ctx),
  );

  // POST /:id/complete — 完成目标
  r.route(
    {
      method: 'post',
      path: '/:id/complete',
      summary: '完成目标',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(GoalClientDTOSchema, '完成成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.complete(req.params!.id, ctx),
  );

  // GET /:id/aggregate — 获取目标聚合视图
  r.route(
    {
      method: 'get',
      path: '/:id/aggregate',
      summary: '获取目标聚合视图',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(GetGoalAggregateResSchema, '获取成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getAggregate(req.params!.id, ctx),
  );

  // GET /:id/progress-breakdown — 获取进度分解
  r.route(
    {
      method: 'get',
      path: '/:id/progress-breakdown',
      summary: '获取目标进度分解',
      request: { params: z.object({ id: brandedId<GoalId>() }) },
      responses: {
        200: successResponse(ProgressBreakdownResSchema, '获取成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.getProgressBreakdown(req.params!.id),
  );

  // POST /:id/clone — 克隆目标
  r.route(
    {
      method: 'post',
      path: '/:id/clone',
      summary: '克隆目标',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
        body: {
          content: {
            'application/json': {
              schema: CloneGoalSchema,
            },
          },
        },
      },
      responses: {
        201: successResponse(GoalClientDTOSchema, '克隆成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.cloneGoal(req.params!.id, (req.body ?? {}) as CloneGoalReq, ctx),
    { successStatus: 201 },
  );

  // PUT /:id/key-results/batch-weight — 批量更新关键结果权重
  r.route(
    {
      method: 'put',
      path: '/:id/key-results/batch-weight',
      summary: '批量更新关键结果权重',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
        body: {
          content: {
            'application/json': {
              schema: BatchUpdateKeyResultWeightsReqSchema,
            },
          },
        },
      },
      responses: {
        200: successResponse(GoalClientDTOSchema, '更新成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) =>
      controller.batchUpdateKeyResultWeights(
        req.params!.id,
        (req.body as { updates?: Array<{ keyResultId: string; weight: number }> } | undefined)
          ?.updates ?? [],
      ),
  );

  return router;
}
