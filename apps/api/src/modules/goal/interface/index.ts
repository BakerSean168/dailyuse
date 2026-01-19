/**
 * Goal Routes Aggregator
 * 聚合所有目标相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerCrudRoutes } from './goal-crud.routes';
import { registerStatusRoutes } from './goal-status.routes';
import { registerKeyResultRoutes } from './goal-keyresult.routes';
import { registerRecordRoutes } from './goal-record.routes';
import { registerReviewRoutes } from './goal-review.routes';
import { registerSearchRoutes } from './goal-search.routes';

export function registerGoalRoutes(): Router {
  const router = ExpressRouter();

  // 聚合所有目标功能路由
  router.use('/', registerCrudRoutes());
  router.use('/', registerStatusRoutes());
  router.use('/', registerKeyResultRoutes());
  router.use('/', registerRecordRoutes());
  router.use('/', registerReviewRoutes());
  router.use('/', registerSearchRoutes());

  return router;
}
