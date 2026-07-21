/**
 * Key Result Routes
 *
 * 关键结果的 CRUD 和进度操作路由。
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
  AddKeyResultSchema,
  UpdateKeyResultSchema,
  UpdateKeyResultProgressSchema,
  KeyResultClientDTOSchema,
  KeyResultListResSchema,
} from '@dailyuse/contracts/goal';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';
import type { GoalController } from '../../server/transport/goal.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerKeyResultRoutes(
  controller: GoalController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router({ mergeParams: true });
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal - Key Result'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // ==================== Key Result CRUD ====================

  // GET /:id/key-results — 获取关键结果列表
  r.route(
    {
      method: 'get',
      path: '/:id/key-results',
      summary: '获取关键结果列表',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
      },
      responses: {
        200: successResponse(KeyResultListResSchema, '获取成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getKeyResults(req.params!.id, ctx),
  );

  // POST /:id/key-results — 添加关键结果
  r.route(
    {
      method: 'post',
      path: '/:id/key-results',
      summary: '添加关键结果',
      request: {
        params: z.object({ id: brandedId<GoalId>() }),
        body: { content: { 'application/json': { schema: AddKeyResultSchema } } },
      },
      responses: {
        201: successResponse(KeyResultClientDTOSchema, '添加成功'),
        404: errorResponse('目标不存在'),
      },
    },
    [auth],
    (req) => controller.addKeyResult(req.params!.id, req.body),
    { successStatus: 201 },
  );

  // PUT /:id/key-results/:krId — 更新关键结果
  r.route(
    {
      method: 'put',
      path: '/:id/key-results/:krId',
      summary: '更新关键结果',
      request: {
        params: z.object({ id: brandedId<GoalId>(), krId: brandedId<KeyResultId>() }),
        body: { content: { 'application/json': { schema: UpdateKeyResultSchema } } },
      },
      responses: {
        200: successResponse(KeyResultClientDTOSchema, '更新成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req) => controller.updateKeyResult(req.params!.id, req.params!.krId, req.body),
  );

  // PATCH /:id/key-results/:krId/progress — 更新关键结果进度
  r.route(
    {
      method: 'patch',
      path: '/:id/key-results/:krId/progress',
      summary: '更新关键结果进度',
      request: {
        params: z.object({ id: brandedId<GoalId>(), krId: brandedId<KeyResultId>() }),
        body: { content: { 'application/json': { schema: UpdateKeyResultProgressSchema } } },
      },
      responses: {
        200: successResponse(KeyResultClientDTOSchema, '更新成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req) => controller.updateKeyResultProgress(req.params!.id, req.params!.krId, req.body),
  );

  // DELETE /:id/key-results/:krId — 删除关键结果
  r.route(
    {
      method: 'delete',
      path: '/:id/key-results/:krId',
      summary: '删除关键结果',
      request: {
        params: z.object({ id: brandedId<GoalId>(), krId: brandedId<KeyResultId>() }),
      },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('目标或关键结果不存在'),
      },
    },
    [auth],
    (req) => controller.deleteKeyResult(req.params!.id, req.params!.krId),
  );

  return router;
}
