/**
 * Reminder Preferences Routes
 *
 * 用户提醒偏好设置路由。
 *
 * Routes:
 *   GET  /preferences — Get user reminder preferences
 *   PUT  /preferences — Update user reminder preferences
 */

import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@memoflow/utils/result';
import {
  UserReminderPreferencesResponseSchema,
  UpdateReminderPreferencesSchema,
} from '@memoflow/contracts/reminder';
import type { ReminderController } from '../../server/transport/reminder.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerReminderPreferencesRoutes(
  controller: ReminderController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/reminders',
    defaultTags: ['Reminder'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // GET /preferences
  r.route(
    {
      method: 'get',
      path: '/preferences',
      summary: '获取用户提醒偏好',
      responses: {
        200: successResponse(UserReminderPreferencesResponseSchema, '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.getPreferences(ctx),
  );

  // PUT /preferences
  r.route(
    {
      method: 'put',
      path: '/preferences',
      summary: '更新用户提醒偏好',
      request: {
        body: { content: { 'application/json': { schema: UpdateReminderPreferencesSchema } } },
      },
      responses: {
        200: successResponse(UserReminderPreferencesResponseSchema, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updatePreferences(req.body, ctx),
  );

  return router;
}
