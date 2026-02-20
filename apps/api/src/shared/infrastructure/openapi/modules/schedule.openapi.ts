/**
 * Schedule Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateScheduleTaskRequestSchema,
  UpdateScheduleTaskRequestSchema,
  ScheduleTaskQueryParamsSchema,
  BatchScheduleTaskOperationRequestSchema,
} from '@dailyuse/contracts/schedule';

// ============================================================================
// Schemas
// ============================================================================

const ScheduleTaskResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  cronExpression: z.string().nullable().optional(),
  nextRunAt: z.number().nullable().optional(),
  lastRunAt: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('ScheduleTask', ScheduleTaskResponseSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/batch',
  tags: ['Schedule'],
  summary: '批量调度任务操作',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: BatchScheduleTaskOperationRequestSchema } } } },
  responses: {
    200: successResponse(z.null(), '操作成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks',
  tags: ['Schedule'],
  summary: '创建调度任务',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateScheduleTaskRequestSchema } } } },
  responses: {
    201: successResponse(ScheduleTaskResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/schedules/tasks',
  tags: ['Schedule'],
  summary: '获取调度任务列表',
  security: [{ bearerAuth: [] }],
  request: { query: ScheduleTaskQueryParamsSchema },
  responses: {
    200: successResponse(z.array(ScheduleTaskResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/schedules/tasks/{id}',
  tags: ['Schedule'],
  summary: '获取调度任务详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(ScheduleTaskResponseSchema, '获取成功'),
    404: errorResponse('调度任务不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/schedules/tasks/{id}',
  tags: ['Schedule'],
  summary: '更新调度任务',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateScheduleTaskRequestSchema } } },
  },
  responses: {
    200: successResponse(ScheduleTaskResponseSchema, '更新成功'),
    404: errorResponse('调度任务不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/schedules/tasks/{id}',
  tags: ['Schedule'],
  summary: '删除调度任务',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('调度任务不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/{id}/pause',
  tags: ['Schedule'],
  summary: '暂停调度任务',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(ScheduleTaskResponseSchema, '暂停成功'),
    404: errorResponse('调度任务不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/{id}/resume',
  tags: ['Schedule'],
  summary: '恢复调度任务',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(ScheduleTaskResponseSchema, '恢复成功'),
    404: errorResponse('调度任务不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/schedules/tasks/{id}/trigger',
  tags: ['Schedule'],
  summary: '手动触发调度任务',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '触发成功'),
    404: errorResponse('调度任务不存在'),
  },
});
