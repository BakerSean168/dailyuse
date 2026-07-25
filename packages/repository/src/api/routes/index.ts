/**
 * Repository Routes Index
 *
 * Only GitHub-backed knowledge repository routes are mounted by the API host.
 * Legacy database Repository/Folder/Resource CRUD builders are gone.
 * Residual 539: stage-6 dual-track retirement — no Folder/Resource CRUD remount.
 * Residual 885: portable boundary re-lock — knowledge-only routes; no editor API remount.
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { RepositoryApplicationPort } from '../../server/application';
import { registerKnowledgeRepositoryConnectionRoutes } from './knowledge-repository-connection.routes';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

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
