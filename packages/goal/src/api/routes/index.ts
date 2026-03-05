/**
 * Goal Routes Index
 *
 * Aggregates all goal-related route registration functions.
 * Follows split-route pattern (like task module).
 *
 * Routes:
 *   Goal CRUD & Status  — goal.routes.ts
 *   Key Results          — key-result.routes.ts
 *   Reviews              — review.routes.ts
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { GoalController } from '../../controllers/goal.controller';
import type { GoalUseCases } from '../../controllers/goal.controller';
import { GoalFolderController } from '../../controllers/goal-folder.controller';
import type { GoalFolderUseCases } from '../../controllers/goal-folder.controller';
import { registerGoalCrudRoutes } from './goal.routes';
import { registerKeyResultRoutes } from './key-result.routes';
import { registerReviewRoutes } from './review.routes';
import { registerRecordRoutes } from './goal-record.routes';
import { registerGoalFolderRoutes } from './goal-folder.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

/**
 * Register all goal routes.
 *
 * The caller mounts the returned Router on `/goals`,
 * so paths inside each sub-module are relative to that prefix.
 */
export function registerGoalRoutes(
  handlers: GoalUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new GoalController(handlers);

  // Each sub-route file returns its own Router
  const crudRouter = registerGoalCrudRoutes(controller, middleware, openApiRegistry);
  const keyResultRouter = registerKeyResultRoutes(controller, middleware, openApiRegistry);
  const reviewRouter = registerReviewRoutes(controller, middleware, openApiRegistry);
  const recordRouter = registerRecordRoutes(controller, middleware, openApiRegistry);

  // Merge all into a single parent router
  const router = Router();
  router.use(crudRouter);
  router.use(keyResultRouter);
  router.use(reviewRouter);
  router.use(recordRouter);

  return router;
}

/**
 * Register all goal-folder routes.
 *
 * The caller mounts the returned Router on `/goal-folders`.
 */
export function registerGoalFolderRoutes_(
  handlers: GoalFolderUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new GoalFolderController(handlers);
  return registerGoalFolderRoutes(controller, middleware, openApiRegistry);
}
