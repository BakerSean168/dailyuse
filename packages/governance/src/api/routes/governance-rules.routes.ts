/**
 * Governance Rules Routes
 * 治理规则资源路由
 */

import { z } from 'zod';
import { Router } from 'express';
import { RouteRegistrar, successResponse, errorResponse } from '@dailyuse/utils/result';
import {
  CreateRuleSchema,
  DeleteRuleResSchema,
  ListRulesQuerySchema,
  SearchRulesQuerySchema,
  UpdateRuleSchema,
} from '@dailyuse/contracts/governance';
import type { ListRulesQueryInput, SearchRulesQueryInput } from '@dailyuse/contracts/governance';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { RuleId } from '@dailyuse/contracts/primitives';
import type { GovernanceController } from '../../server/transport/governance.controller';
import type { GovernanceOpenApiRegistry, PlatformMiddleware } from './governance-route-shared';
import {
  GovernanceListRulesResponseSchema,
  GovernanceSearchRulesResponseSchema,
  RuleResponseSchema,
  parseNumber,
  parseString,
  parseStringArray,
} from './governance-route-shared';

/**
 * Registers all HTTP routes for the governance Rule resource.
 * 注册治理 Rule 资源的全部 HTTP 路由。
 * @param controller - Governance controller orchestrating route handlers.
 * @param middleware - Platform auth and role middleware bundle.
 * @param openApiRegistry - Optional OpenAPI registry for route registration.
 * @returns Express router containing all Rule resource routes.
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
        200: successResponse(GovernanceSearchRulesResponseSchema, '搜索成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.searchRules(
        {
          query: parseString(req.query?.query) ?? parseString(req.query?.q) ?? '',
          status: parseString(req.query?.status) as SearchRulesQueryInput['status'],
          severity: parseString(req.query?.severity) as SearchRulesQueryInput['severity'],
          tags: parseStringArray(req.query?.tags),
          page: parseNumber(req.query?.page),
          pageSize: parseNumber(req.query?.pageSize),
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
        200: successResponse(GovernanceListRulesResponseSchema, '获取成功'),
      },
    },
    [auth],
    (req) =>
      controller.listRules({
        status: parseString(req.query?.status) as ListRulesQueryInput['status'],
        severity: parseString(req.query?.severity) as ListRulesQueryInput['severity'],
        tags: parseStringArray(req.query?.tags),
        page: parseNumber(req.query?.page),
        pageSize: parseNumber(req.query?.pageSize),
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
    (req, ctx) => controller.updateRuleById(req.params!.id, req.body, ctx),
  );

  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.updateRuleById(req.params!.id, req.body, ctx),
  );

  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除规则',
      request: { params: z.object({ id: brandedId<RuleId>() }) },
      responses: {
        200: successResponse(DeleteRuleResSchema, '删除成功'),
        404: errorResponse('规则不存在'),
        403: errorResponse('权限不足'),
      },
    },
    [auth, requireRole(['TechLead', 'Architect'])],
    (req, ctx) => controller.deleteRuleById(req.params!.id, ctx),
  );

  return router;
}