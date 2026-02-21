/**
 * Goal Review Routes
 *
 * 目标复盘路由。
 */

import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateGoalReviewSchema,
  GoalReviewClientDTOSchema,
  type CreateGoalReviewReq,
} from '@dailyuse/contracts/goal';
import type { GoalController } from '../../controllers/goal.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerReviewRoutes(
  controller: GoalController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router({ mergeParams: true });
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal - Review'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /:id/reviews — 添加目标复盘
  r.route(
    {
      method: 'post',
      path: '/:id/reviews',
      summary: '添加目标复盘',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: CreateGoalReviewSchema } } },
      },
      responses: {
        201: successResponse(GoalReviewClientDTOSchema, '添加成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.addReview(req.params!.id, req.body as CreateGoalReviewReq),
    { successStatus: 201 },
  );

  return router;
}
