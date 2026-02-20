/**
 * Reminder Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateReminderTemplateSchema,
  UpdateReminderTemplateSchema,
  CreateReminderGroupSchema,
  UpdateReminderGroupSchema,
  SwitchGroupControlModeSchema,
} from '@dailyuse/contracts/reminder';

// ============================================================================
// Schemas
// ============================================================================

const ReminderTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable().optional(),
  isEnabled: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const ReminderGroupResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  controlMode: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('ReminderTemplate', ReminderTemplateResponseSchema);
registry.register('ReminderGroup', ReminderGroupResponseSchema);

// ============================================================================
// Template Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/templates',
  tags: ['Reminder'],
  summary: '创建提醒模板',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateReminderTemplateSchema } } } },
  responses: {
    201: successResponse(ReminderTemplateResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/templates',
  tags: ['Reminder'],
  summary: '获取提醒模板列表',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(ReminderTemplateResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/templates/upcoming',
  tags: ['Reminder'],
  summary: '获取即将触发的提醒',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(ReminderTemplateResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/templates/{id}',
  tags: ['Reminder'],
  summary: '获取提醒模板详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(ReminderTemplateResponseSchema, '获取成功'),
    404: errorResponse('模板不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/reminders/templates/{id}',
  tags: ['Reminder'],
  summary: '更新提醒模板',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateReminderTemplateSchema } } },
  },
  responses: {
    200: successResponse(ReminderTemplateResponseSchema, '更新成功'),
    404: errorResponse('模板不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/reminders/templates/{id}',
  tags: ['Reminder'],
  summary: '删除提醒模板',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('模板不存在'),
  },
});

// ============================================================================
// Group Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/groups',
  tags: ['Reminder'],
  summary: '创建提醒分组',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateReminderGroupSchema } } } },
  responses: {
    201: successResponse(ReminderGroupResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/groups',
  tags: ['Reminder'],
  summary: '获取提醒分组列表',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(ReminderGroupResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reminders/groups/{id}',
  tags: ['Reminder'],
  summary: '获取提醒分组详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(ReminderGroupResponseSchema, '获取成功'),
    404: errorResponse('分组不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/reminders/groups/{id}',
  tags: ['Reminder'],
  summary: '更新提醒分组',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateReminderGroupSchema } } },
  },
  responses: {
    200: successResponse(ReminderGroupResponseSchema, '更新成功'),
    404: errorResponse('分组不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/reminders/groups/{id}',
  tags: ['Reminder'],
  summary: '删除提醒分组',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('分组不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/groups/{id}/control-mode',
  tags: ['Reminder'],
  summary: '切换分组控制模式',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: SwitchGroupControlModeSchema } } },
  },
  responses: {
    200: successResponse(ReminderGroupResponseSchema, '切换成功'),
    404: errorResponse('分组不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/reminders/groups/{id}/batch',
  tags: ['Reminder'],
  summary: '批量操作分组模板',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '操作成功'),
    404: errorResponse('分组不存在'),
  },
});
