/**
 * Editor Routes Index
 *
 * Aggregates all editor-related route registration functions.
 * Follows split-route pattern (like goal module).
 *
 * Routes:
 *   Workspaces — workspace.routes.ts
 *   Documents  — document.routes.ts
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { EditorController } from '../../controllers/editor.controller';
import type { EditorUseCases } from '../../controllers/editor.controller';
import { registerWorkspaceRoutes } from './workspace.routes';
import { registerDocumentRoutes } from './document.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

/**
 * Register all editor routes.
 *
 * Backward-compatible signature — drop-in replacement for the
 * original monolithic `registerEditorRoutes` in routes.ts.
 */
export function registerEditorRoutes(
  handlers: EditorUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new EditorController(handlers);

  // Each sub-route file returns its own Router
  const workspaceRouter = registerWorkspaceRoutes(controller, middleware, openApiRegistry);
  const documentRouter = registerDocumentRoutes(controller, middleware, openApiRegistry);

  // Merge all into a single parent router
  const router = Router();
  router.use(workspaceRouter);
  router.use(documentRouter);

  return router;
}
