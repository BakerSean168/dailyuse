/**
 * Reminder Template Routes
 *
 * 提醒模板的增删改查路由。
 *
 * Routes:
 *   POST   /templates          — Create reminder template
 *   GET    /templates          — List templates for current user
 *   GET    /templates/upcoming — Get upcoming reminders
 *   GET    /templates/:id      — Get template by ID
 *   PUT    /templates/:id      — Update template
 *   DELETE /templates/:id      — Delete template
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
  CreateReminderTemplateSchema,
  UpdateReminderTemplateSchema,
  ReminderTemplateResponseSchema,
  type CreateReminderTemplateReq,
  type UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import type { ReminderController } from '../../controllers/reminder.controller';

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

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerReminderTemplateRoutes(
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

  // ==================== Template CRUD ====================

  // POST /templates
  r.route(
    {
      method: 'post',
      path: '/templates',
      summary: '创建提醒模板',
      request: { body: { content: { 'application/json': { schema: CreateReminderTemplateSchema } } } },
      responses: {
        201: successResponse(ReminderTemplateResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createTemplate(req.body as CreateReminderTemplateReq, ctx),
    { successStatus: 201 },
  );

  // GET /templates
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

  // GET /templates/upcoming
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
    (req, ctx) => controller.getUpcomingReminders({
      limit: parseNumber(req.query?.limit),
      beforeTime: parseString(req.query?.beforeTime),
    }, ctx),
  );

  // GET /templates/:id
  r.route(
    {
      method: 'get',
      path: '/templates/:id',
      summary: '获取提醒模板详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.getTemplate(req.params!.id),
  );

  // PUT /templates/:id
  r.route(
    {
      method: 'put',
      path: '/templates/:id',
      summary: '更新提醒模板',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateReminderTemplateSchema } } },
      },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '更新成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.updateTemplate(req.params!.id, req.body as UpdateReminderTemplateReq),
  );

  // DELETE /templates/:id
  r.route(
    {
      method: 'delete',
      path: '/templates/:id',
      summary: '删除提醒模板',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.deleteTemplate(req.params!.id),
  );

  return router;
}
