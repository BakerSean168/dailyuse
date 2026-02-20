/**
 * Setting Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  UpdateUserSettingSchema,
  ResetUserSettingSchema,
} from '@dailyuse/contracts/setting';

// ============================================================================
// Schemas
// ============================================================================

const UserSettingResponseSchema = z.object({
  id: z.string().uuid(),
  appearance: z.record(z.unknown()).optional(),
  locale: z.record(z.unknown()).optional(),
  workflow: z.record(z.unknown()).optional(),
  privacy: z.record(z.unknown()).optional(),
  experimental: z.record(z.unknown()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('UserSetting', UserSettingResponseSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/settings',
  tags: ['Setting'],
  summary: '获取用户设置',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(UserSettingResponseSchema, '获取成功'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/settings',
  tags: ['Setting'],
  summary: '更新用户设置',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateUserSettingSchema } } } },
  responses: {
    200: successResponse(UserSettingResponseSchema, '更新成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/settings/reset',
  tags: ['Setting'],
  summary: '重置用户设置',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: ResetUserSettingSchema } } } },
  responses: {
    200: successResponse(UserSettingResponseSchema, '重置成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/settings/export',
  tags: ['Setting'],
  summary: '导出设置',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.record(z.unknown()), '导出成功'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/settings/import',
  tags: ['Setting'],
  summary: '导入设置',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: z.record(z.unknown()) } } } },
  responses: {
    200: successResponse(UserSettingResponseSchema, '导入成功'),
    400: errorResponse('格式错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/settings/defaults',
  tags: ['Setting'],
  summary: '获取默认设置',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(UserSettingResponseSchema, '获取成功'),
  },
});
