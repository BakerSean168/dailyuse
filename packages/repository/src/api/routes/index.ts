/**
 * Repository Routes Index
 *
 * Aggregates all repository-related route registration functions.
 * Follows split-route pattern (like goal module).
 *
 * Routes:
 * Only GitHub-backed knowledge repository routes are mounted by the API.
 * Legacy database Repository/Folder/Resource route builders remain internal
 * migration code and are deliberately not reachable from the host router.
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { RepositoryApplicationPort } from '../../server/application';
import { registerKnowledgeRepositoryConnectionRoutes } from './knowledge-repository-connection.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

/**
 * Register repository routes (mounted at /repositories).
 */
export function registerRepositoryRoutes(
  api: RepositoryApplicationPort,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  return registerKnowledgeRepositoryConnectionRoutes(api, middleware, openApiRegistry);
}
