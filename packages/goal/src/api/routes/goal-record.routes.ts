/**
 * Goal Record Routes
 *
 * 目标进度记录（GoalRecord）路由。
 *
 * Routes:
 *   POST   /:id/key-results/:krId/records          — 创建记录
 *   GET    /:id/key-results/:krId/records           — 按 KeyResult 查询记录
 *   GET    /:id/records                             — 按 Goal 查询记录
 *   DELETE /:id/key-results/:krId/records/:recordId — 删除记录
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
  CreateGoalRecordSchema,
  GoalRecordClientDTOSchema,
} from '@dailyuse/contracts/goal';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { GoalId, KeyResultId, GoalRecordId } from '@dailyuse/contracts/primitives';
import type { GoalController } from '../../controllers/goal.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerRecordRoutes(
  controller: GoalController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router({ mergeParams: true });
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal - Record'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /:id/key-results/:krId/records — 创建进度记录
  r.route(
    {
      method: 'post',
      path: '/:id/key-results/:krId/records',
      summary: '创建进度记录',
      request: {
        params: z.object({
          id: brandedId<GoalId>(),
          krId: brandedId<KeyResultId>(),
        }),
        body: {
          content: {
            'application/json': {
              schema: z.object({
                value: z.number().min(0),
                note: z.string().max(500).optional(),
              }),
            },
          },
        },
      },
      responses: {
        201: successResponse(GoalRecordClientDTOSchema, '创建成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.createRecord(req.params!.id, req.params!.krId, req.body, ctx),
    { successStatus: 201 },
  );

  // GET /:id/key-results/:krId/records — 按 KeyResult 查询记录
  r.route(
    {
      method: 'get',
      path: '/:id/key-results/:krId/records',
      summary: '按关键结果查询进度记录',
      request: {
        params: z.object({
          id: brandedId<GoalId>(),
          krId: brandedId<KeyResultId>(),
        }),
        query: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
          offset: z.coerce.number().int().min(0).default(0).optional(),
        }),
      },
      responses: {
        200: successResponse(
          z.object({
            data: z.array(GoalRecordClientDTOSchema),
            total: z.number(),
          }),
          '查询成功',
        ),
      },
    },
    [auth],
    (req) =>
      controller.listRecordsByKeyResult(
        req.params!.id,
        req.params!.krId,
        req.query as { limit?: number; offset?: number },
      ),
  );

  // GET /:id/records — 按 Goal 查询所有记录
  r.route(
    {
      method: 'get',
      path: '/:id/records',
      summary: '按目标查询所有进度记录',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
        query: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
          offset: z.coerce.number().int().min(0).default(0).optional(),
        }),
      },
      responses: {
        200: successResponse(
          z.object({
            data: z.array(GoalRecordClientDTOSchema),
            total: z.number(),
          }),
          '查询成功',
        ),
      },
    },
    [auth],
    (req) =>
      controller.listRecordsByGoal(
        req.params!.id,
        req.query as { limit?: number; offset?: number },
      ),
  );

  // DELETE /:id/key-results/:krId/records/:recordId — 删除记录
  r.route(
    {
      method: 'delete',
      path: '/:id/key-results/:krId/records/:recordId',
      summary: '删除进度记录',
      request: {
        params: z.object({
          id: brandedId<GoalId>(),
          krId: brandedId<KeyResultId>(),
          recordId: brandedId<GoalRecordId>(),
        }),
      },
      responses: {
        200: successResponse(z.object({ success: z.boolean() }), '删除成功'),
        404: errorResponse('记录不存在'),
      },
    },
    [auth],
    (req) => controller.deleteRecord(req.params!.recordId),
  );

  return router;
}
