/**
 * Task Routes Index
 * 
 * Aggregates all task-related route registration functions.
 * Follows ADR-021/022 split-route pattern.
 */

import { Router, type RequestHandler } from 'express';
import type { TaskTemplateController } from '../controllers/task-template.controller';
import type { TaskInstanceController } from '../controllers/task-instance.controller';
import type { TaskStatsController } from '../controllers/task-stats.controller';
import { registerTaskTemplateRoutes } from './task-template.routes';
import { registerTaskInstanceRoutes } from './task-instance.routes';
import { registerTaskStatsRoutes } from './task-stats.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

interface TaskControllers {
  templateController: TaskTemplateController;
  instanceController: TaskInstanceController;
  statsController: TaskStatsController;
}

// ============ Route Registration ============

/**
 * Register all task routes with their appropriate prefixes
 */
export function registerTaskRoutes(
  controllers: TaskControllers,
  middleware: PlatformMiddleware,
  rootRouter: Router,
): void {
  // Task Templates: /api/task-templates
  const templateRouter = registerTaskTemplateRoutes(
    controllers.templateController,
    middleware,
  );
  rootRouter.use('/task-templates', templateRouter);

  // Task Instances: /api/task-instances
  const instanceRouter = registerTaskInstanceRoutes(
    controllers.instanceController,
    middleware,
  );
  rootRouter.use('/task-instances', instanceRouter);

  // Task Stats: /api/tasks
  const statsRouter = registerTaskStatsRoutes(
    controllers.statsController,
    middleware,
  );
  rootRouter.use('/tasks', statsRouter);
}
