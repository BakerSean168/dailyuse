/**
 * Governance Routes Index
 * 治理路由索引
 *
 * Aggregates all governance route registration functions.
 * 聚合所有治理路由注册函数。
 *
 * Resource groups:
 * - Rules           - governance-rules.routes.ts
 * - Rule revisions  - governance-rule-revisions.routes.ts
 */

import { Router } from 'express';
import { GovernanceController } from '../../controllers/governance.controller';
import type { GovernanceUseCases } from '../../controllers/governance.controller';
import type { GovernanceOpenApiRegistry, PlatformMiddleware } from './governance-route-shared';
import { registerGovernanceRulesRoutes } from './governance-rules.routes';
import { registerGovernanceRuleRevisionsRoutes } from './governance-rule-revisions.routes';

/** Registers all governance routes with resource-first ordering. 以资源优先顺序注册所有治理路由。 */
export function registerGovernanceRoutes(
  handlers: GovernanceUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: GovernanceOpenApiRegistry,
): Router {
  const controller = new GovernanceController(handlers);
  const router = Router();

  router.use(registerGovernanceRulesRoutes(controller, middleware, openApiRegistry));
  router.use(registerGovernanceRuleRevisionsRoutes(controller, middleware, openApiRegistry));

  return router;
}
