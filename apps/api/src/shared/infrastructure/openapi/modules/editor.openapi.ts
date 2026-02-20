/**
 * Editor Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateEditorWorkspaceSchema,
  UpdateEditorWorkspaceSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
} from '@dailyuse/contracts/editor';

// ============================================================================
// Schemas
// ============================================================================

const WorkspaceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  projectPath: z.string(),
  projectType: z.string(),
  isActive: z.boolean(),
  lastAccessedAt: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  path: z.string(),
  name: z.string(),
  language: z.string(),
  contentHash: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

registry.register('EditorWorkspace', WorkspaceResponseSchema);
registry.register('EditorDocument', DocumentResponseSchema);

// ============================================================================
// Workspace Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/editor/workspaces',
  tags: ['Editor'],
  summary: '创建工作区',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateEditorWorkspaceSchema } } } },
  responses: {
    201: successResponse(WorkspaceResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/workspaces',
  tags: ['Editor'],
  summary: '获取工作区列表',
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse(z.array(WorkspaceResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/workspaces/{id}',
  tags: ['Editor'],
  summary: '获取工作区详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(WorkspaceResponseSchema, '获取成功'),
    404: errorResponse('工作区不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/editor/workspaces/{id}',
  tags: ['Editor'],
  summary: '更新工作区',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateEditorWorkspaceSchema } } },
  },
  responses: {
    200: successResponse(WorkspaceResponseSchema, '更新成功'),
    404: errorResponse('工作区不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/editor/workspaces/{id}',
  tags: ['Editor'],
  summary: '删除工作区',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('工作区不存在'),
  },
});

// ============================================================================
// Document Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/editor/documents',
  tags: ['Editor'],
  summary: '创建文档',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateDocumentSchema } } } },
  responses: {
    201: successResponse(DocumentResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/documents',
  tags: ['Editor'],
  summary: '获取文档列表',
  security: [{ bearerAuth: [] }],
  request: { query: z.object({ workspaceId: z.string().uuid().optional(), folderId: z.string().uuid().optional() }) },
  responses: {
    200: successResponse(z.array(DocumentResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/editor/documents/{id}',
  tags: ['Editor'],
  summary: '获取文档详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(DocumentResponseSchema, '获取成功'),
    404: errorResponse('文档不存在'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/editor/documents/{id}',
  tags: ['Editor'],
  summary: '更新文档',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateDocumentSchema } } },
  },
  responses: {
    200: successResponse(DocumentResponseSchema, '更新成功'),
    404: errorResponse('文档不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/editor/documents/{id}',
  tags: ['Editor'],
  summary: '删除文档',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('文档不存在'),
  },
});
