/**
 * Governance Rule Revisions Routes
 * 治理规则修订资源路由
 *
 * Handles revision history endpoints for governance rules.
 * 处理治理规则的修订历史端点。
 *
 * Routes:
 * - GET /:id/revisions - Get rule revisions
 */

import { z } from 'zod';
import { Router } from 'express';
import { RouteRegistrar, successResponse } from '@dailyuse/utils/result';
import { GetRuleRevisionsQuerySchema } from '../../contracts';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { RuleId } from '@dailyuse/contracts/primitives';
import type { GovernanceController } from '../../controllers/governance.controller';
import type { GovernanceOpenApiRegistry, PlatformMiddleware } from './governance-route-shared';
import { RuleRevisionResponseSchema, parseNumber } from './governance-route-shared';

/** Registers revision sub-resource routes for Rule. 注册 Rule 的修订子资源路由。 */
export function registerGovernanceRuleRevisionsRoutes(
  controller: GovernanceController,
  middleware: PlatformMiddleware,
  openApiRegistry?: GovernanceOpenApiRegistry,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/governance/rules',
    defaultTags: ['Governance'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'get',
      path: '/:id/revisions',
      summary: '获取规则修订历史',
      request: {
        params: z.object({ id: brandedId<RuleId>() }),
        query: GetRuleRevisionsQuerySchema.omit({ ruleId: true }),
      },
      responses: {
        200: successResponse(
          z.object({
            items: z.array(RuleRevisionResponseSchema),
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
      controller.getRevisions(req.params!.id, {
        page: parseNumber(req.query?.page) ?? 1,
        pageSize: parseNumber(req.query?.pageSize) ?? 20,
      }),
  );

  return router;
}
