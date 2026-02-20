/**
 * Goal Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateGoalSchema,
  UpdateGoalSchema,
  QueryGoalsSchema,
  AddKeyResultSchema,
  CreateGoalReviewSchema,
} from '@dailyuse/contracts/goal';

// ============================================================================
// Schemas
// ============================================================================

const GoalResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  importance: z.string(),
  progress: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('Goal', GoalResponseSchema);
registry.register('CreateGoal', CreateGoalSchema);
registry.register('UpdateGoal', UpdateGoalSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/goals',
  tags: ['Goal'],
  summary: '创建目标',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateGoalSchema } } } },
  responses: {
    201: successResponse(GoalResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/goals',
  tags: ['Goal'],
  summary: '获取目标列表',
  security: [{ bearerAuth: [] }],
  request: { query: QueryGoalsSchema },
  responses: {
    200: successResponse(z.array(GoalResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/goals/search',
  tags: ['Goal'],
  summary: '搜索目标',
  security: [{ bearerAuth: [] }],
  request: { query: z.object({ keyword: z.string().optional(), status: z.string().optional() }) },
  responses: {
    200: successResponse(z.array(GoalResponseSchema), '搜索成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/goals/{id}',
  tags: ['Goal'],
  summary: '获取目标详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(GoalResponseSchema, '获取成功'),
    404: errorResponse('目标不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/goals/{id}',
  tags: ['Goal'],
  summary: '更新目标',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateGoalSchema } } },
  },
  responses: {
    200: successResponse(GoalResponseSchema, '更新成功'),
    404: errorResponse('目标不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/goals/{id}',
  tags: ['Goal'],
  summary: '删除目标',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('目标不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/archive',
  tags: ['Goal'],
  summary: '归档目标',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(GoalResponseSchema, '归档成功'),
    404: errorResponse('目标不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/activate',
  tags: ['Goal'],
  summary: '激活目标',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(GoalResponseSchema, '激活成功'),
    404: errorResponse('目标不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/key-results',
  tags: ['Goal'],
  summary: '添加关键结果',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: AddKeyResultSchema } } },
  },
  responses: {
    201: successResponse(z.object({ id: z.string().uuid() }), '添加成功'),
    404: errorResponse('目标不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/goals/{id}/reviews',
  tags: ['Goal'],
  summary: '添加目标复盘',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: CreateGoalReviewSchema } } },
  },
  responses: {
    201: successResponse(z.object({ id: z.string().uuid() }), '添加成功'),
    404: errorResponse('目标不存在'),
  },
});
