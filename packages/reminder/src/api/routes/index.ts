/**
 * Reminder Routes Index
 *
 * Aggregates all reminder-related route registration functions.
 * Follows split-route pattern (like goal module).
 *
 * Routes:
 *   Templates  — reminder-template.routes.ts
 *   Groups     — reminder-group.routes.ts
 */

import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { ReminderApplicationPort } from '../../server/application';
import { ReminderController } from '../../server/transport/reminder.controller';
import { registerReminderTemplateRoutes } from './reminder-template.routes';
import { registerReminderGroupRoutes } from './reminder-group.routes';
import { registerReminderPreferencesRoutes } from './reminder-preferences.routes';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

/**
 * Register all reminder routes.
 *
 * Backward-compatible signature — drop-in replacement for the
 * original monolithic `registerReminderRoutes` in routes.ts.
 */
export function registerReminderRoutes(
  api: ReminderApplicationPort,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const controller = new ReminderController(api);

  // Each sub-route file returns its own Router
  const templateRouter = registerReminderTemplateRoutes(controller, middleware, openApiRegistry);
  const groupRouter = registerReminderGroupRoutes(controller, middleware, openApiRegistry);
  const preferencesRouter = registerReminderPreferencesRoutes(controller, middleware, openApiRegistry);

  // Merge all into a single parent router
  const router = Router();
  router.use(templateRouter);
  router.use(groupRouter);
  router.use(preferencesRouter);

  return router;
}
