/**
 * Governance CRUD Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   POST   /              — 创建规则 (CreateRuleSchema)
 *   PUT    /:id           — 更新规则 (UpdateRuleSchema)
 *   PATCH  /:id           — 更新规则（别名）
 *   DELETE /:id           — 删除规则
 *   GET    /by-code/:code — 按代码获取规则
 *   GET    /:id/revisions — 获取修订历史
 *   GET    /:id           — 按 ID 获取规则
 *   GET    /              — 列表查询规则
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
  CreateRuleSchema,
  UpdateRuleSchema,
  ListRulesQuerySchema,
  SearchRulesQuerySchema,
  GetRuleRevisionsQuerySchema,
} from '../contracts';
import type { ListRulesQuery, SearchRulesQuery } from '../contracts';
import { GovernanceController } from '../controllers/governance.controller';
import type { GovernanceUseCases } from '../controllers/governance.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === 'string') {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  return undefined;
}

// ============ Response Schemas ============

const RuleResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.string(),
  tags: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const RuleRevisionResponseSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string().uuid(),
  version: z.number(),
  createdAt: z.number(),
});

// ============ Route Registration ============

export function registerGovernanceCrudRoutes(
  handlers: GovernanceUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth, requireRole } = middleware;
  const controller = new GovernanceController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/governance/rules',
    defaultTags: ['Governance'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — 创建规则
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建规则',
      request: { body: { content: { 'application/json': { schema: CreateRuleSchema } } } },
      responses: {
        201: successResponse(RuleResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
        403: errorResponse('权限不足'),
      },
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.createRule(req.body, ctx),
    { successStatus: 201 },
  );

  // PUT /:id — 更新规则
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新规则',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateRuleSchema } } },
      },
      responses: {
        200: successResponse(RuleResponseSchema, '更新成功'),
        404: errorResponse('规则不存在'),
        403: errorResponse('权限不足'),
      },
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.updateRule(req.params!.id, req.body, ctx),
  );

  // PATCH /:id — 更新规则（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.updateRule(req.params!.id, req.body, ctx),
  );

  // DELETE /:id — 删除规则
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除规则',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.object({ success: z.boolean() }), '删除成功'),
        404: errorResponse('规则不存在'),
        403: errorResponse('权限不足'),
      },
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.deleteRule(req.params!.id, ctx),
  );

  // GET /by-code/:code — 按代码获取规则 (must be before /:id)
  r.route(
    {
      method: 'get',
      path: '/by-code/:code',
      summary: '按代码获取规则',
      request: { params: z.object({ code: z.string() }) },
      responses: {
        200: successResponse(RuleResponseSchema, '获取成功'),
        404: errorResponse('规则不存在'),
      },
    },
    [auth],
    (req) => controller.getRuleByCode(req.params!.code),
  );

  // GET /:id/revisions — 获取修订历史 (must be before /:id)
  r.route(
    {
      method: 'get',
      path: '/search',
      summary: '搜索规则',
      request: { query: SearchRulesQuerySchema },
      responses: {
        200: successResponse(
          z.object({
            items: z.array(RuleResponseSchema),
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
            searchTime: z.number(),
          }),
          '搜索成功',
        ),
      },
    },
    [auth],
    (req, ctx) =>
      controller.searchRules(
        {
          query: parseString(req.query?.query) ?? parseString(req.query?.q) ?? '',
          status: parseString(req.query?.status) as SearchRulesQuery['status'],
          severity: parseString(req.query?.severity) as SearchRulesQuery['severity'],
          tags: parseStringArray(req.query?.tags),
          page: parseNumber(req.query?.page) ?? 1,
          pageSize: parseNumber(req.query?.pageSize) ?? 20,
        },
        ctx,
      ),
  );

  // GET /:id/revisions — 获取修订历史 (must be before /:id)
  r.route(
    {
      method: 'get',
      path: '/:id/revisions',
      summary: '获取规则修订历史',
      request: {
        params: z.object({ id: z.string().uuid() }),
        query: GetRuleRevisionsQuerySchema.omit({ ruleId: true }),
      },
      responses: {
        200: successResponse(
          z.object({
            items: z.array(RuleRevisionResponseSchema),
            total: z.number(),
          }),
          '获取成功',
        ),
      },
    },
    [auth],
    (req) =>
      controller.getRevisions(req.params!.id, {
        page: parseNumber(req.query?.page) ?? 1,
        pageSize: parseNumber(req.query?.pageSize) ?? 20,
      }),
  );

  // GET /:id — 按 ID 获取规则
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '按 ID 获取规则',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(RuleResponseSchema, '获取成功'),
        404: errorResponse('规则不存在'),
      },
    },
    [auth],
    (req) => controller.getRuleById(req.params!.id),
  );

  // GET / — 列表查询规则
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '查询规则列表',
      request: { query: ListRulesQuerySchema },
      responses: {
        200: successResponse(
          z.object({
            items: z.array(RuleResponseSchema),
            total: z.number(),
          }),
          '获取成功',
        ),
      },
    },
    [auth],
    (req) =>
      controller.listRules({
        status: parseString(req.query?.status) as ListRulesQuery['status'],
        severity: parseString(req.query?.severity) as ListRulesQuery['severity'],
        tags: parseStringArray(req.query?.tags),
        page: parseNumber(req.query?.page) ?? 1,
        pageSize: parseNumber(req.query?.pageSize) ?? 20,
      }),
  );

  return router;
}
