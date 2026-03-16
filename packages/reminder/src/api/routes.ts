/**
 * Reminder API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   POST   /templates              — Create reminder template
 *   GET    /templates              — List templates for current user
 *   GET    /templates/upcoming     — Get upcoming reminders
 *   GET    /templates/:id          — Get template by ID
 *   PUT    /templates/:id          — Update template
 *   DELETE /templates/:id          — Delete template
 *   POST   /groups                 — Create reminder group
 *   GET    /groups                 — List groups for current user
 *   GET    /groups/:id             — Get group by ID
 *   PUT    /groups/:id             — Update group
 *   DELETE /groups/:id             — Delete group
 *   POST   /groups/:id/control-mode — Switch group control mode
 *   POST   /groups/:id/batch       — Batch group template operations
 */

import { z } from 'zod';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateReminderTemplateSchema,
  UpdateReminderTemplateSchema,
  CreateReminderGroupSchema,
  UpdateReminderGroupSchema,
  SwitchGroupControlModeSchema,
  BatchGroupTemplatesSchema,
  ReminderTemplateResponseSchema,
  ReminderGroupResponseSchema,
  ReminderBatchResultSchema,
} from '@dailyuse/contracts/reminder';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { ReminderTemplateId, ReminderGroupId } from '@dailyuse/contracts/primitives';
import { ReminderController } from '../controllers/reminder.controller';
import type { ReminderUseCases } from '../controllers/reminder.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function registerReminderRoutes(
  handlers: ReminderUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new ReminderController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/reminders',
    defaultTags: ['Reminder'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // ────────── Template Routes ──────────

  // POST /templates — Create reminder template
  r.route(
    {
      method: 'post',
      path: '/templates',
      summary: '创建提醒模板',
      request: {
        body: { content: { 'application/json': { schema: CreateReminderTemplateSchema } } },
      },
      responses: {
        201: successResponse(ReminderTemplateResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createTemplate(req.body, ctx),
    { successStatus: 201 },
  );

  // GET /templates — List templates for current user
  r.route(
    {
      method: 'get',
      path: '/templates',
      summary: '获取提醒模板列表',
      responses: {
        200: successResponse(z.array(ReminderTemplateResponseSchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.listTemplates(ctx),
  );

  // GET /templates/upcoming — Get upcoming reminders (must be before /templates/:id)
  r.route(
    {
      method: 'get',
      path: '/templates/upcoming',
      summary: '获取即将到来的提醒',
      request: {
        query: z.object({
          limit: z.string().optional(),
          beforeTime: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(
          z.object({
            data: z.array(ReminderTemplateResponseSchema),
            total: z.number(),
          }),
          '获取成功',
        ),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getUpcomingReminders(
        {
          limit: parseNumber(req.query?.limit),
          beforeTime: parseString(req.query?.beforeTime),
        },
        ctx,
      ),
  );

  // GET /templates/:id — Get template by ID
  r.route(
    {
      method: 'get',
      path: '/templates/:id',
      summary: '获取提醒模板详情',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getTemplate(req.params!.id, ctx),
  );

  // PUT /templates/:id — Update template
  r.route(
    {
      method: 'put',
      path: '/templates/:id',
      summary: '更新提醒模板',
      request: {
        params: z.object({ id: brandedId<ReminderTemplateId>() }),
        body: { content: { 'application/json': { schema: UpdateReminderTemplateSchema } } },
      },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '更新成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateTemplate(req.params!.id, req.body, ctx),
  );

  // DELETE /templates/:id — Delete template
  r.route(
    {
      method: 'delete',
      path: '/templates/:id',
      summary: '删除提醒模板',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteTemplate(req.params!.id, ctx),
  );

  // ────────── Group Routes ──────────

  // POST /groups — Create reminder group
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
    (req, ctx) => controller.createGroup(req.body, ctx),
    { successStatus: 201 },
  );

  // GET /groups — List groups for current user
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

  // GET /groups/:id — Get group by ID
  r.route(
    {
      method: 'get',
      path: '/groups/:id',
      summary: '获取提醒分组详情',
      request: { params: z.object({ id: brandedId<ReminderGroupId>() }) },
      responses: {
        200: successResponse(ReminderGroupResponseSchema, '获取成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getGroup(req.params!.id, ctx),
  );

  // PUT /groups/:id — Update group
  r.route(
    {
      method: 'put',
      path: '/groups/:id',
      summary: '更新提醒分组',
      request: {
        params: z.object({ id: brandedId<ReminderGroupId>() }),
        body: { content: { 'application/json': { schema: UpdateReminderGroupSchema } } },
      },
      responses: {
        200: successResponse(ReminderGroupResponseSchema, '更新成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateGroup(req.params!.id, req.body, ctx),
  );

  // DELETE /groups/:id — Delete group
  r.route(
    {
      method: 'delete',
      path: '/groups/:id',
      summary: '删除提醒分组',
      request: { params: z.object({ id: brandedId<ReminderGroupId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteGroup(req.params!.id, ctx),
  );

  // POST /groups/:id/control-mode — Switch group control mode
  r.route(
    {
      method: 'post',
      path: '/groups/:id/control-mode',
      summary: '切换分组控制模式',
      request: {
        params: z.object({ id: brandedId<ReminderGroupId>() }),
        body: { content: { 'application/json': { schema: SwitchGroupControlModeSchema } } },
      },
      responses: {
        200: successResponse(ReminderGroupResponseSchema, '切换成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.switchGroupControlMode(req.params!.id, req.body),
  );

  // POST /groups/:id/batch — Batch group template operations
  r.route(
    {
      method: 'post',
      path: '/groups/:id/batch',
      summary: '批量操作分组模板',
      request: {
        params: z.object({ id: brandedId<ReminderGroupId>() }),
        body: { content: { 'application/json': { schema: BatchGroupTemplatesSchema } } },
      },
      responses: {
        200: successResponse(ReminderBatchResultSchema, '操作成功'),
        404: errorResponse('分组不存在'),
      },
    },
    [auth],
    (req) => controller.batchGroupTemplates(req.params!.id, req.body),
  );

  return router;
}
