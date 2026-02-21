/**
 * Reminder Group Routes
 *
 * 提醒分组的增删改查及控制模式/批量操作路由。
 *
 * Routes:
 *   POST   /groups                  — Create reminder group
 *   GET    /groups                  — List groups for current user
 *   GET    /groups/:id              — Get group by ID
 *   PUT    /groups/:id              — Update group
 *   DELETE /groups/:id              — Delete group
 *   POST   /groups/:id/control-mode — Switch group control mode
 *   POST   /groups/:id/batch        — Batch group template operations
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
  CreateReminderGroupSchema,
  UpdateReminderGroupSchema,
  SwitchGroupControlModeSchema,
  BatchGroupTemplatesSchema,
  ReminderGroupResponseSchema,
  ReminderBatchResultSchema,
  type CreateReminderGroupReq,
  type UpdateReminderGroupReq,
  type SwitchGroupControlModeReq,
  type BatchGroupTemplatesReq,
} from '@dailyuse/contracts/reminder';
import type { ReminderController } from '../../controllers/reminder.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerReminderGroupRoutes(
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

  // ==================== Group CRUD ====================

  // POST /groups
  r.route(
    {
      method: 'post',
      path: '/groups',
      summary: '创建提醒分组',
      request: { body: { content: { 'application/json': { schema: CreateReminderGroupSchema } } } },
      responses: {
        201: successResponse(ReminderGroupResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createGroup(req.body as CreateReminderGroupReq, ctx),
    { successStatus: 201 },
  );

  // GET /groups
  r.route(
    {
      method: 'get',
      path: '/groups',
      summary: '获取提醒分组列表',
      responses: {
        200: successResponse(z.array(ReminderGroupResponseSchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.listGroups(ctx),
  );

  // GET /groups/:id
  r.route(
    {
      method: 'get',
      path: '/groups/:id',
      summary: '获取提醒分组详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(ReminderGroupResponseSchema, '获取成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.getGroup(req.params!.id),
  );

  // PUT /groups/:id
  r.route(
    {
      method: 'put',
      path: '/groups/:id',
      summary: '更新提醒分组',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateReminderGroupSchema } } },
      },
      responses: {
        200: successResponse(ReminderGroupResponseSchema, '更新成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.updateGroup(req.params!.id, req.body as UpdateReminderGroupReq),
  );

  // DELETE /groups/:id
  r.route(
    {
      method: 'delete',
      path: '/groups/:id',
      summary: '删除提醒分组',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.deleteGroup(req.params!.id),
  );

  // ==================== Group Actions ====================

  // POST /groups/:id/control-mode
  r.route(
    {
      method: 'post',
      path: '/groups/:id/control-mode',
      summary: '切换分组控制模式',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: SwitchGroupControlModeSchema } } },
      },
      responses: {
        200: successResponse(ReminderGroupResponseSchema, '切换成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.switchGroupControlMode(req.params!.id, req.body as SwitchGroupControlModeReq),
  );

  // POST /groups/:id/batch
  r.route(
    {
      method: 'post',
      path: '/groups/:id/batch',
      summary: '批量操作分组模板',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: BatchGroupTemplatesSchema } } },
      },
      responses: {
        200: successResponse(ReminderBatchResultSchema, '操作成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.batchGroupTemplates(req.params!.id, req.body as BatchGroupTemplatesReq),
  );

  return router;
}
