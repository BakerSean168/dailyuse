/**
 * Task Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateTaskTemplateSchema,
  UpdateTaskTemplateSchema,
  QueryTaskTemplatesSchema,
  GetTaskInstancesByRangeSchema,
} from '@dailyuse/contracts/task';

// ============================================================================
// Schemas
// ============================================================================

const TaskTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const TaskInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  scheduledDate: z.number(),
  status: z.string(),
  completedAt: z.number().nullable().optional(),
  createdAt: z.number(),
});

registry.register('TaskTemplate', TaskTemplateResponseSchema);
registry.register('TaskInstance', TaskInstanceResponseSchema);

// ============================================================================
// Task Template Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates',
  tags: ['Task Template'],
  summary: '创建任务模板',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateTaskTemplateSchema } } } },
  responses: {
    201: successResponse(TaskTemplateResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/task-templates',
  tags: ['Task Template'],
  summary: '获取任务模板列表',
  security: [{ bearerAuth: [] }],
  request: { query: QueryTaskTemplatesSchema },
  responses: {
    200: successResponse(z.array(TaskTemplateResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/task-templates/{id}',
  tags: ['Task Template'],
  summary: '获取任务模板详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskTemplateResponseSchema, '获取成功'),
    404: errorResponse('模板不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/task-templates/{id}',
  tags: ['Task Template'],
  summary: '更新任务模板',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateTaskTemplateSchema } } },
  },
  responses: {
    200: successResponse(TaskTemplateResponseSchema, '更新成功'),
    404: errorResponse('模板不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/task-templates/{id}',
  tags: ['Task Template'],
  summary: '删除任务模板',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('模板不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates/{id}/activate',
  tags: ['Task Template'],
  summary: '激活任务模板',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskTemplateResponseSchema, '激活成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates/{id}/pause',
  tags: ['Task Template'],
  summary: '暂停任务模板',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskTemplateResponseSchema, '暂停成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-templates/{id}/archive',
  tags: ['Task Template'],
  summary: '归档任务模板',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskTemplateResponseSchema, '归档成功'),
  },
});

// ============================================================================
// Task Instance Paths
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/task-instances',
  tags: ['Task Instance'],
  summary: '获取任务实例列表',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/task-instances/by-date-range',
  tags: ['Task Instance'],
  summary: '按日期范围获取任务实例',
  security: [{ bearerAuth: [] }],
  request: { query: GetTaskInstancesByRangeSchema },
  responses: {
    200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/task-instances/{id}',
  tags: ['Task Instance'],
  summary: '获取任务实例详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskInstanceResponseSchema, '获取成功'),
    404: errorResponse('实例不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-instances/{id}/complete',
  tags: ['Task Instance'],
  summary: '完成任务实例',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskInstanceResponseSchema, '完成成功'),
    404: errorResponse('实例不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-instances/{id}/skip',
  tags: ['Task Instance'],
  summary: '跳过任务实例',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskInstanceResponseSchema, '跳过成功'),
    404: errorResponse('实例不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/task-instances/{id}/start',
  tags: ['Task Instance'],
  summary: '开始任务实例',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(TaskInstanceResponseSchema, '开始成功'),
    404: errorResponse('实例不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/task-instances/{id}',
  tags: ['Task Instance'],
  summary: '删除任务实例',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('实例不存在'),
  },
});
