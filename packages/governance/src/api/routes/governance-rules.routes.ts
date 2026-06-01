/**
 * Governance Rules Routes
 * 治理规则资源路由
 *
 * Resource-first HTTP routes for the `Rule` aggregate.
 * 面向资源的 `Rule` 聚合根 HTTP 路由。
 *
 * Why this split:
 * - Domain layer is organized by aggregate root / entity.
 * - Application layer is organized by commands / queries.
 * - Route layer is organized by external resources / features.
 * 采用该拆分的原因：
 * - 领域层按聚合根 / 实体组织。
 * - 应用层按 commands / queries 组织。
 * - 路由层按外部资源 / feature 组织。
 *
 * Routes:
 * - POST   /              - Create rule
 * - GET    /              - List rules
 * - GET    /search        - Search rules
 * - GET    /by-code/:code - Get rule by code
 * - GET    /:id           - Get rule by ID
 * - PUT    /:id           - Update rule
 * - PATCH  /:id           - Update rule alias
 * - DELETE /:id           - Delete rule
 */

import { z } from 'zod';
import { Router } from 'express';
import { RouteRegistrar, successResponse, errorResponse } from '@dailyuse/utils/result';
import {
  CreateRuleSchema,
  ListRulesQuerySchema,
  SearchRulesQuerySchema,
  UpdateRuleSchema,
} from '../../contracts';
import type { ListRulesQuery, SearchRulesQuery } from '../../contracts';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { RuleId } from '@dailyuse/contracts/primitives';
import type { GovernanceController } from '../../controllers/governance.controller';
import type { GovernanceOpenApiRegistry, PlatformMiddleware } from './governance-route-shared';
import {
  RuleResponseSchema,
  parseNumber,
  parseString,
  parseStringArray,
} from './governance-route-shared';

/**
 * Registers resource-first routes for the Rule aggregate. 注册 Rule 聚合根的资源优先路由。
 *
 * @param controller - GovernanceController 实例
 * @param middleware - Platform middleware 集合
 * @param openApiRegistry - optional OpenAPI registry for route registration
 * @returns Router - express Router with resource routes
 */
export function registerGovernanceRulesRoutes(
  controller: GovernanceController,
  middleware: PlatformMiddleware,
  openApiRegistry?: GovernanceOpenApiRegistry,
): Router {
  const router = Router();
  const { auth, requireRole } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/governance/rules',
    defaultTags: ['Governance'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

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
            page: z.number(),
            pageSize: z.number(),
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

  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '按 ID 获取规则',
      request: { params: z.object({ id: brandedId<RuleId>() }) },
      responses: {
        200: successResponse(RuleResponseSchema, '获取成功'),
        404: errorResponse('规则不存在'),
      },
    },
    [auth],
    (req) => controller.getRuleById(req.params!.id),
  );

  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新规则',
      request: {
        params: z.object({ id: brandedId<RuleId>() }),
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

  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.updateRule(req.params!.id, req.body, ctx),
  );

  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除规则',
      request: { params: z.object({ id: brandedId<RuleId>() }) },
      responses: {
        200: successResponse(z.object({ success: z.boolean() }), '删除成功'),
        404: errorResponse('规则不存在'),
        403: errorResponse('权限不足'),
      },
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.deleteRule(req.params!.id, ctx),
  );

  return router;
}
