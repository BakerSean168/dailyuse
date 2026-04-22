/**
 * Editor Routes Index
 *
 * Aggregates all editor-related route registration functions.
 * Follows split-route pattern (like goal module).
 *
 * Routes:
 *   Workspaces — workspace.routes.ts
 *   Sessions   — session.routes.ts
 *   Groups     — group.routes.ts
 *   Tabs       — tab.routes.ts
 *   Content    — content.routes.ts
 *   Search     — search.routes.ts
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { EditorController } from '../../controllers/editor.controller';
import type { EditorUseCases } from '../../controllers/editor.controller';
import { registerWorkspaceRoutes } from './workspace.routes';
import { registerSessionRoutes } from './session.routes';
import { registerGroupRoutes } from './group.routes';
import { registerTabRoutes } from './tab.routes';
import { registerContentRoutes } from './content.routes';
import { registerSearchRoutes } from './search.routes';

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
  const sessionRouter = registerSessionRoutes(controller, middleware, openApiRegistry);
  const groupRouter = registerGroupRoutes(controller, middleware, openApiRegistry);
  const tabRouter = registerTabRoutes(controller, middleware, openApiRegistry);
  const contentRouter = registerContentRoutes(controller, middleware, openApiRegistry);
  const searchRouter = registerSearchRoutes(controller, middleware, openApiRegistry);

  // Merge all into a single parent router
  const router = Router();
  router.use(workspaceRouter);
  router.use(sessionRouter);
  router.use(groupRouter);
  router.use(tabRouter);
  router.use(contentRouter);
  router.use(searchRouter);

  return router;
}
