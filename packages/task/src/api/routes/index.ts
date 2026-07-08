/**
 * Task Routes Index
 * 
 * Aggregates all task-related route registration functions.
 * Follows ADR-021/022 split-route pattern.
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { TaskTemplateController } from '../../server/transport/task-template.controller';
import type { TaskInstanceController } from '../../server/transport/task-instance.controller';
import type { TaskDependencyController } from '../../server/transport/task-dependency.controller';
import { registerTaskTemplateRoutes } from './task-template.routes';
import { registerTaskInstanceRoutes } from './task-instance.routes';
import { registerTaskDependencyRoutes } from './task-dependency.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

interface TaskControllers {
  templateController: TaskTemplateController;
  instanceController: TaskInstanceController;
  dependencyController: TaskDependencyController;
}

// ============ Route Registration ============

/**
 * Register all task routes with their appropriate prefixes
 */
export function registerTaskRoutes(
  controllers: TaskControllers,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();

  // Task Templates: /api/task-templates
  const templateRouter = registerTaskTemplateRoutes(
    controllers.templateController,
    middleware,
    openApiRegistry,
  );
  router.use('/task-templates', templateRouter);

  // Task Instances: /api/task-instances
  const instanceRouter = registerTaskInstanceRoutes(
    controllers.instanceController,
    middleware,
    openApiRegistry,
  );
  router.use('/task-instances', instanceRouter);

  // Task Dependencies: /api/tasks (sub-paths /:taskId/dependencies, /dependencies/:id)
  const dependencyRouter = registerTaskDependencyRoutes(
    controllers.dependencyController,
    middleware,
    openApiRegistry,
  );
  router.use('/tasks', dependencyRouter);

  return router;
}
