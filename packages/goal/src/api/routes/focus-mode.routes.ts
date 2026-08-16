/**
 * Focus mode routes.
 * 专注模式路由。
 */

import { Router, type RequestHandler } from 'express';
import { RouteRegistrar, type OpenApiRegistryLike, successResponse } from '@memoflow/utils/result';
import {
  ActivateFocusModeSchema,
  DeactivateFocusModeInvocationSchema,
  ExtendFocusModeSchema,
  FocusModeClientDTOSchema,
} from '@memoflow/contracts/goal';
import type { GoalController } from '../../server/transport/goal.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerFocusModeRoutes(
  controller: GoalController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal', 'FocusMode'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'get',
      path: '/focus-mode',
      summary: '获取当前专注模式',
      responses: { 200: successResponse(FocusModeClientDTOSchema, '获取成功') },
    },
    [auth],
    (_req, ctx) => controller.getCurrentFocusMode(ctx),
  );

  r.routeWithValidation(
    {
      method: 'post',
      path: '/focus-mode/activate',
      summary: '激活专注模式',
      request: { body: { content: { 'application/json': { schema: ActivateFocusModeSchema } } } },
      responses: { 200: successResponse(FocusModeClientDTOSchema, '激活成功') },
      validation: { schema: ActivateFocusModeSchema },
    },
    [auth],
    (data, ctx) => controller.activateFocusMode(data, ctx),
  );

  r.routeWithValidation(
    {
      method: 'post',
      path: '/focus-mode/deactivate',
      summary: '停用专注模式',
      responses: { 200: successResponse(FocusModeClientDTOSchema, '停用成功') },
      validation: {
        schema: DeactivateFocusModeInvocationSchema,
      },
    },
    [auth],
    (_data, ctx) => controller.deactivateFocusMode(ctx),
  );

  r.routeWithValidation(
    {
      method: 'post',
      path: '/focus-mode/extend',
      summary: '延长专注模式',
      request: { body: { content: { 'application/json': { schema: ExtendFocusModeSchema } } } },
      responses: { 200: successResponse(FocusModeClientDTOSchema, '延长成功') },
      validation: { schema: ExtendFocusModeSchema },
    },
    [auth],
    (data, ctx) => controller.extendFocusMode(data, ctx),
  );

  return router;
}
