/**
 * Metrics Routes Aggregator
 * 聚合所有性能指标相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerMetricsDetailsRoutes } from './metrics.routes';

export function registerMetricsRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 性能指标主路由 ============
  router.use('/', registerMetricsDetailsRoutes());

  return router;
}
