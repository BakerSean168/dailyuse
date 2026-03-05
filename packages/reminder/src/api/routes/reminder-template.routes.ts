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
} from '@dailyuse/contracts/reminder';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { ReminderTemplateId } from '@dailyuse/contracts/primitives';
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
    (req, ctx) =>
      controller.getUpcomingReminders(
        {
          limit: parseNumber(req.query?.limit),
          beforeTime: parseString(req.query?.beforeTime),
        },
        ctx,
      ),
  );

  // GET /templates/:id
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
    (req) => controller.getTemplate(req.params!.id),
  );

  // PUT /templates/:id
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
    (req) => controller.updateTemplate(req.params!.id, req.body),
  );

  // DELETE /templates/:id
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
    (req) => controller.deleteTemplate(req.params!.id),
  );

  // ==================== Template Actions ====================

  // POST /templates/:id/enable
  r.route(
    {
      method: 'post',
      path: '/templates/:id/enable',
      summary: '启用提醒模板',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '启用成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.enableTemplate(req.params!.id),
  );

  // POST /templates/:id/pause
  r.route(
    {
      method: 'post',
      path: '/templates/:id/pause',
      summary: '暂停提醒模板',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '暂停成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.pauseTemplate(req.params!.id),
  );

  // POST /templates/:id/toggle
  r.route(
    {
      method: 'post',
      path: '/templates/:id/toggle',
      summary: '切换提醒模板启用/暂停状态',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '切换成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.toggleTemplate(req.params!.id),
  );

  // POST /templates/:id/move
  r.route(
    {
      method: 'post',
      path: '/templates/:id/move',
      summary: '移动提醒模板到其他分组',
      request: {
        params: z.object({ id: brandedId<ReminderTemplateId>() }),
        body: { content: { 'application/json': { schema: z.object({ groupId: z.string() }) } } },
      },
      responses: {
        200: successResponse(ReminderTemplateResponseSchema, '移动成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.moveTemplate(req.params!.id, req.body),
  );

  // GET /templates/:id/history
  r.route(
    {
      method: 'get',
      path: '/templates/:id/history',
      summary: '获取提醒模板触发历史',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(z.array(z.object({}).passthrough()), '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.getTemplateHistory(req.params!.id),
  );

  // ==================== Response Routes ====================

  // POST /templates/:id/response
  r.route(
    {
      method: 'post',
      path: '/templates/:id/response',
      summary: '记录提醒响应',
      request: {
        params: z.object({ id: brandedId<ReminderTemplateId>() }),
        body: { content: { 'application/json': { schema: z.object({ action: z.string(), note: z.string().optional() }) } } },
      },
      responses: {
        201: successResponse(z.object({}).passthrough(), '记录成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.recordResponse(req.params!.id, req.body),
    { successStatus: 201 },
  );

  // GET /templates/:id/responses
  r.route(
    {
      method: 'get',
      path: '/templates/:id/responses',
      summary: '获取提醒响应历史',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(z.array(z.object({}).passthrough()), '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.getTemplateResponses(req.params!.id),
  );

  // GET /templates/:id/responses/stats
  r.route(
    {
      method: 'get',
      path: '/templates/:id/responses/stats',
      summary: '获取提醒响应统计',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(z.object({}).passthrough(), '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.getResponseStats(req.params!.id),
  );

  // ==================== Frequency Analysis Routes ====================

  // GET /templates/:id/frequency-analysis
  r.route(
    {
      method: 'get',
      path: '/templates/:id/frequency-analysis',
      summary: '分析提醒频率效果',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(z.object({}).passthrough(), '分析成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.analyzeFrequency(req.params!.id),
  );

  // POST /templates/:id/frequency-adjustment
  r.route(
    {
      method: 'post',
      path: '/templates/:id/frequency-adjustment',
      summary: '应用频率调整',
      request: {
        params: z.object({ id: brandedId<ReminderTemplateId>() }),
        body: { content: { 'application/json': { schema: z.object({ action: z.string(), customInterval: z.number().optional() }) } } },
      },
      responses: {
        200: successResponse(z.object({}).passthrough(), '调整成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.adjustFrequency(req.params!.id, req.body),
  );

  // POST /templates/:id/frequency-adjustment/reject
  r.route(
    {
      method: 'post',
      path: '/templates/:id/frequency-adjustment/reject',
      summary: '拒绝频率调整建议',
      request: { params: z.object({ id: brandedId<ReminderTemplateId>() }) },
      responses: {
        200: successResponse(z.object({}).passthrough(), '已拒绝'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.rejectFrequencyAdjustment(req.params!.id),
  );

  return router;
}
