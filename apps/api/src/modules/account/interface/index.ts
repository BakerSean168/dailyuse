/**
 * Account Routes Aggregator
 * 聚合所有账户相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerProfileRoutes } from './account-profile.routes';
import { registerDeletionRoutes } from './account-deletion.routes';
// import { registerSessionRoutes } from './account-session.routes';
import { AccountModule } from '@dailyuse/infrastructure-server';

export function registerAccountRoutes(module: AccountModule): Router {
  const router = ExpressRouter();

  // 聚合所有账户功能路由
  router.use('/', registerProfileRoutes(module.profileService));
  // router.use('/', registerSessionRoutes()); // Suspended pending Auth module refactor
  router.use('/', registerDeletionRoutes(module.deletionService));

  return router;
}
