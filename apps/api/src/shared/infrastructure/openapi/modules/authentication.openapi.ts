/**
 * Authentication Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  RegisterByEmailSchema,
  LoginByEmailSchema,
  RefreshTokenSchema,
} from '@dailyuse/contracts/authentication';

// ============================================================================
// Schemas
// ============================================================================

const AuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

registry.register('AuthToken', AuthTokenResponseSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Authentication'],
  summary: '用户注册',
  request: { body: { content: { 'application/json': { schema: RegisterByEmailSchema } } } },
  responses: {
    201: successResponse(AuthTokenResponseSchema, '注册成功'),
    400: errorResponse('参数错误'),
    409: errorResponse('用户已存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Authentication'],
  summary: '用户登录',
  request: { body: { content: { 'application/json': { schema: LoginByEmailSchema } } } },
  responses: {
    200: successResponse(AuthTokenResponseSchema, '登录成功'),
    401: errorResponse('认证失败'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Authentication'],
  summary: '用户登出',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.null(), '登出成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Authentication'],
  summary: '刷新 Token',
  request: { body: { content: { 'application/json': { schema: RefreshTokenSchema } } } },
  responses: {
    200: successResponse(AuthTokenResponseSchema, '刷新成功'),
    401: errorResponse('Token 无效'),
  },
});
