/**
 * Repository Routes Index
 *
 * Aggregates all repository-related route registration functions.
 * Follows split-route pattern (like goal module).
 *
 * Routes:
 *   Repository CRUD + nested resources — repository.routes.ts
 *   Standalone resources               — resource.routes.ts
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { RepositoryController } from '../../controllers/repository.controller';
import type { RepositoryUseCases } from '../../controllers/repository.controller';
import { registerRepositoryCrudRoutes } from './repository.routes';
import { registerStandaloneResourceRoutes } from './resource.routes';
import { registerNestedFolderRoutes, registerStandaloneFolderRoutes } from './folder.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

/**
 * Register repository routes (mounted at /repositories).
 *
 * Backward-compatible signature — drop-in replacement for the
 * original `registerRepositoryRoutes` in routes.ts.
 */
export function registerRepositoryRoutes(
  handlers: RepositoryUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new RepositoryController(handlers);
  const crudRouter = registerRepositoryCrudRoutes(controller, middleware, openApiRegistry);
  const nestedFolderRouter = registerNestedFolderRoutes(controller, middleware, openApiRegistry);

  // Merge repository CRUD + nested folder routes
  const router = Router();
  router.use(crudRouter);
  router.use(nestedFolderRouter);
  return router;
}

/**
 * Register standalone resource routes (mounted at /resources).
 *
 * Backward-compatible signature — drop-in replacement for the
 * original `registerResourceRoutes` in routes.ts.
 */
export function registerResourceRoutes(
  handlers: RepositoryUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new RepositoryController(handlers);
  return registerStandaloneResourceRoutes(controller, middleware, openApiRegistry);
}

/**
 * Register standalone folder routes (mounted at /folders).
 */
export function registerFolderRoutes(
  handlers: RepositoryUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new RepositoryController(handlers);
  return registerStandaloneFolderRoutes(controller, middleware, openApiRegistry);
}
