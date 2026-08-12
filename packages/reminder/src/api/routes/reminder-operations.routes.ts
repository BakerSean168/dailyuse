/**
 * Reminder Operation Timeline / Replay / Audit Routes (W7)
 *
 * 统一 operation timeline 查询 + replay + 审计。
 * 最小权限：identity 只能查询/重放自己的操作；replay 落审计。
 *
 * Routes:
 *   GET  /operations/timeline        — Unified operation timeline (identity-scoped)
 *   POST /operations/:id/replay      — Replay a dead-lettered occurrence (audited)
 *   GET  /operations/audit           — Actor-scoped audit trail
 */

import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@memoflow/utils/result';
import {
  OperationTimelineEntrySchema,
  OperationAuditRecordSchema,
} from '@memoflow/contracts/operations';
import { BusinessOperationReceiptSchema } from '@memoflow/contracts/reliable-messaging';
import type { ReminderController } from '../../server/transport/reminder.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerReminderOperationsRoutes(
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

  // GET /operations/timeline
  r.route(
    {
      method: 'get',
      path: '/operations/timeline',
      summary: '查询统一操作时间线（W7，identity 最小权限）',
      responses: {
        200: successResponse(z.array(OperationTimelineEntrySchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.queryOperationTimeline(ctx),
  );

  // POST /operations/:id/replay
  r.route(
    {
      method: 'post',
      path: '/operations/:id/replay',
      summary: '重放死信操作并记录审计（W7）',
      request: { params: z.object({ id: z.string().min(1) }) },
      responses: {
        200: successResponse(BusinessOperationReceiptSchema, '重放成功'),
        404: errorResponse('操作不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.replayOperation(req.params!.id, ctx),
  );

  // GET /operations/audit
  r.route(
    {
      method: 'get',
      path: '/operations/audit',
      summary: '查询操作审计记录（W7，actor 最小权限）',
      responses: {
        200: successResponse(z.array(OperationAuditRecordSchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.getOperationAudit(ctx),
  );

  return router;
}
