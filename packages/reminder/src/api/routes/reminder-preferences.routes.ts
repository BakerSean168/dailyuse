/**
 * Reminder Preferences Routes
 *
 * 用户提醒偏好设置路由。
 *
 * Routes:
 *   GET  /preferences — Get user reminder preferences
 *   PUT  /preferences — Update user reminder preferences
 */

import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import type { ReminderController } from '../../controllers/reminder.controller';

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
        200: successResponse(z.object({}).passthrough(), '获取成功'),
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
        body: { content: { 'application/json': { schema: z.object({}).passthrough() } } },
      },
      responses: {
        200: successResponse(z.object({}).passthrough(), '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updatePreferences(req.body, ctx),
  );

  return router;
}
