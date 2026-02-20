/**
 * Repository Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateRepositorySchema,
  UpdateRepositorySchema,
  CreateResourceSchema,
  UpdateResourceSchema,
} from '@dailyuse/contracts/repository';

// ============================================================================
// Schemas
// ============================================================================

const RepositoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const ResourceResponseSchema = z.object({
  id: z.string().uuid(),
  repositoryId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  mimeType: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('Repository', RepositoryResponseSchema);
registry.register('Resource', ResourceResponseSchema);

// ============================================================================
// Repository Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories',
  tags: ['Repository'],
  summary: '创建仓库',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateRepositorySchema } } } },
  responses: {
    201: successResponse(RepositoryResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/repositories',
  tags: ['Repository'],
  summary: '获取仓库列表',
  security: [{ bearerAuth: [] }],
  request: { query: z.object({ status: z.string().optional(), type: z.string().optional() }) },
  responses: {
    200: successResponse(z.array(RepositoryResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/repositories/{id}',
  tags: ['Repository'],
  summary: '获取仓库详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(RepositoryResponseSchema, '获取成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/repositories/{id}',
  tags: ['Repository'],
  summary: '更新仓库',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateRepositorySchema } } },
  },
  responses: {
    200: successResponse(RepositoryResponseSchema, '更新成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/repositories/{id}',
  tags: ['Repository'],
  summary: '删除仓库',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories/{id}/archive',
  tags: ['Repository'],
  summary: '归档仓库',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(RepositoryResponseSchema, '归档成功'),
    404: errorResponse('仓库不存在'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories/{id}/activate',
  tags: ['Repository'],
  summary: '激活仓库',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(RepositoryResponseSchema, '激活成功'),
    404: errorResponse('仓库不存在'),
  },
});

// ============================================================================
// Resource Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/repositories/{repoId}/resources',
  tags: ['Resource'],
  summary: '创建资源',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ repoId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: CreateResourceSchema } } },
  },
  responses: {
    201: successResponse(ResourceResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/repositories/{repoId}/resources',
  tags: ['Resource'],
  summary: '获取仓库资源列表',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ repoId: z.string().uuid() }),
    query: z.object({ folderId: z.string().uuid().optional(), status: z.string().optional() }),
  },
  responses: {
    200: successResponse(z.array(ResourceResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/resources/{id}',
  tags: ['Resource'],
  summary: '获取资源详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(ResourceResponseSchema, '获取成功'),
    404: errorResponse('资源不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/resources/{id}',
  tags: ['Resource'],
  summary: '更新资源',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateResourceSchema } } },
  },
  responses: {
    200: successResponse(ResourceResponseSchema, '更新成功'),
    404: errorResponse('资源不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/resources/{id}',
  tags: ['Resource'],
  summary: '删除资源',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('资源不存在'),
  },
});
