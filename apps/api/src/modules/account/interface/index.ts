/**
 * Account Routes Aggregator
 * 聚合所有账户相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerProfileRoutes } from './account-profile.routes';
import { registerSessionRoutes } from './account-session.routes';
import { registerDeletionRoutes } from './account-deletion.routes';

export function registerAccountRoutes(): Router {
  const router = ExpressRouter();

  // 聚合所有账户功能路由
  router.use('/', registerProfileRoutes());
  router.use('/', registerSessionRoutes());
  router.use('/', registerDeletionRoutes());

  return router;
}
