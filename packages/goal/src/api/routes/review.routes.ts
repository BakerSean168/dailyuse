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
import { CreateGoalReviewSchema, UpdateGoalReviewSchema, GoalReviewClientDTOSchema, GoalReviewListResSchema, DeleteSuccessResSchema } from '@dailyuse/contracts/goal';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { GoalId, GoalReviewId } from '@dailyuse/contracts/primitives';
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
        params: z.object({ id: brandedId<GoalId>() }),
        body: { content: { 'application/json': { schema: CreateGoalReviewSchema } } },
      },
      responses: {
        201: successResponse(GoalReviewClientDTOSchema, '添加成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.addReview(req.params!.id, req.body),
    { successStatus: 201 },
  );

  // GET /:id/reviews — 获取目标复盘列表
  r.route(
    {
      method: 'get',
      path: '/:id/reviews',
      summary: '获取目标复盘列表',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
      },
      responses: {
        200: successResponse(GoalReviewListResSchema, '查询成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.listReviews(req.params!.id),
  );

  // PUT /:id/reviews/:reviewId — 更新复盘
  r.route(
    {
      method: 'put',
      path: '/:id/reviews/:reviewId',
      summary: '更新目标复盘',
      request: {
        params: z.object({
          id: brandedId<GoalId>(),
          reviewId: brandedId<GoalReviewId>(),
        }),
        body: { content: { 'application/json': { schema: UpdateGoalReviewSchema } } },
      },
      responses: {
        200: successResponse(GoalReviewClientDTOSchema, '更新成功'),
        404: errorResponse('目标或复盘不存在'),
      },
    },
    [auth],
    (req) => controller.updateReview(req.params!.id, req.params!.reviewId, req.body),
  );

  // DELETE /:id/reviews/:reviewId — 删除复盘
  r.route(
    {
      method: 'delete',
      path: '/:id/reviews/:reviewId',
      summary: '删除目标复盘',
      request: {
        params: z.object({
          id: brandedId<GoalId>(),
          reviewId: brandedId<GoalReviewId>(),
        }),
      },
      responses: {
        200: successResponse(DeleteSuccessResSchema, '删除成功'),
        404: errorResponse('目标或复盘不存在'),
      },
    },
    [auth],
    (req) => controller.deleteReview(req.params!.id, req.params!.reviewId),
  );

  return router;
}
