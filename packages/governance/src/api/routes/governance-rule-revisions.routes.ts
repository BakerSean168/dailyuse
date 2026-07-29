/**
 * Governance Rule Revisions Routes
 * 治理规则修订资源路由
 */

import { z } from 'zod';
import { Router } from 'express';
import { RouteRegistrar, successResponse } from '@memoflow/utils/result';
import {
  GetRuleRevisionsQuerySchema,
  GetRuleRevisionsResSchema,
} from '@memoflow/contracts/governance';
import { brandedId } from '@memoflow/contracts/primitives';
import type { RuleId } from '@memoflow/contracts/primitives';
import type { GovernanceController } from '../../server/transport/governance.controller';
import type { GovernanceOpenApiRegistry, PlatformMiddleware } from './governance-route-shared';
import { parseNumber } from './governance-route-shared';

/**
 * Registers HTTP routes for the governance RuleRevision child resource.
 * 注册治理 RuleRevision 子资源的 HTTP 路由。
 * @param controller - Governance controller orchestrating revision queries.
 * @param middleware - Platform auth middleware bundle.
 * @param openApiRegistry - Optional OpenAPI registry for route registration.
 * @returns Express router containing all RuleRevision child routes.
 */
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
        200: successResponse(GetRuleRevisionsResSchema, '获取成功'),
      },
    },
    [auth],
    (req) =>
      controller.getRevisionsByRuleId(req.params!.id, {
        page: parseNumber(req.query?.page),
        pageSize: parseNumber(req.query?.pageSize),
      }),
  );

  return router;
}