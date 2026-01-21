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

import { GoalModule } from '@dailyuse/infrastructure-server';

export function registerGoalRoutes(goalModule: GoalModule): Router {
  const router = ExpressRouter();

  // 聚合所有目标功能路由
  router.use('/', registerCrudRoutes(goalModule.goalApplicationService));
  // router.use('/', registerStatusRoutes(goalModule.goalApplicationService)); // Todo
  router.use('/', registerKeyResultRoutes(goalModule.goalKeyResultApplicationService));

  router.use('/', registerStatusRoutes(goalModule.goalApplicationService));

  router.use('/', registerRecordRoutes(goalModule.goalRecordApplicationService));
  router.use('/', registerReviewRoutes(goalModule.goalReviewApplicationService));
  router.use('/', registerSearchRoutes(goalModule.goalApplicationService));

  return router;
}
