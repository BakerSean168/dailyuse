/**
 * Account Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  UpdateAccountSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
} from '@dailyuse/contracts/account';

// ============================================================================
// Schemas
// ============================================================================

const AccountResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string(),
  avatar: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('Account', AccountResponseSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/account/me',
  tags: ['Account'],
  summary: '获取当前用户信息',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(AccountResponseSchema, '获取成功'),
    401: errorResponse('未认证'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/account/me',
  tags: ['Account'],
  summary: '更新用户信息',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateAccountSchema } } } },
  responses: {
    200: successResponse(AccountResponseSchema, '更新成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/account/availability',
  tags: ['Account'],
  summary: '检查昵称/邮箱可用性',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CheckAvailabilitySchema } } } },
  responses: {
    200: successResponse(z.object({ available: z.boolean() }), '检查完成'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/account/me/close',
  tags: ['Account'],
  summary: '注销账户',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CloseAccountSchema } } } },
  responses: {
    200: successResponse(z.null(), '注销成功'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/account/me',
  tags: ['Account'],
  summary: '注销账户 (别名)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.null(), '注销成功'),
  },
});
