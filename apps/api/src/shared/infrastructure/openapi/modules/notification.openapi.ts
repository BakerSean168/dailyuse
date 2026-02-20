/**
 * Notification Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkAsReadBatchSchema,
  DeleteNotificationsBatchSchema,
} from '@dailyuse/contracts/notification';

// ============================================================================
// Schemas
// ============================================================================

const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable().optional(),
  type: z.string(),
  isRead: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('Notification', NotificationResponseSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications',
  tags: ['Notification'],
  summary: '创建通知',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateNotificationSchema } } } },
  responses: {
    201: successResponse(NotificationResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/notifications',
  tags: ['Notification'],
  summary: '获取通知列表',
  security: [{ bearerAuth: [] }],
  request: { query: NotificationQuerySchema },
  responses: {
    200: successResponse(z.array(NotificationResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/notifications/{id}',
  tags: ['Notification'],
  summary: '获取通知详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(NotificationResponseSchema, '获取成功'),
    404: errorResponse('通知不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/notifications/{id}',
  tags: ['Notification'],
  summary: '更新通知',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateNotificationSchema } } },
  },
  responses: {
    200: successResponse(NotificationResponseSchema, '更新成功'),
    404: errorResponse('通知不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/notifications/{id}',
  tags: ['Notification'],
  summary: '删除通知',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('通知不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/{id}/read',
  tags: ['Notification'],
  summary: '标记通知已读',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(NotificationResponseSchema, '标记成功'),
    404: errorResponse('通知不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/batch/read',
  tags: ['Notification'],
  summary: '批量标记已读',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: MarkAsReadBatchSchema } } } },
  responses: {
    200: successResponse(z.null(), '批量标记成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/batch/delete',
  tags: ['Notification'],
  summary: '批量删除通知',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: DeleteNotificationsBatchSchema } } } },
  responses: {
    200: successResponse(z.null(), '批量删除成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/notifications/cleanup',
  tags: ['Notification'],
  summary: '清理过期通知',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.object({ deletedCount: z.number() }), '清理成功'),
  },
});
