/**
 * Repository - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { RepositoryId, ResourceId } from '../../../primitives';

/**
 * Repository Response Schema
 */
export const RepositoryResponseSchema = z.object({
  id: brandedId<RepositoryId>(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Resource Response Schema
 */
export const ResourceResponseSchema = z.object({
  id: brandedId<ResourceId>(),
  repositoryId: brandedId<RepositoryId>(),
  name: z.string(),
  type: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ResourceBookmarkResponseSchema = z.object({
  id: z.string(),
  resourceId: brandedId<ResourceId>(),
  identityId: z.string(),
  aliasName: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  sortOrder: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  displayName: z.string(),
  isOwner: z.boolean(),
});

export const UploadResourceSuccessResponseSchema = z.object({
  fileName: z.string(),
  resource: ResourceResponseSchema,
});

export const UploadResourceFailureResponseSchema = z.object({
  fileName: z.string(),
  code: z.string(),
  message: z.string(),
});

export const UploadResourcesResponseSchema = z.object({
  successes: z.array(UploadResourceSuccessResponseSchema),
  failures: z.array(UploadResourceFailureResponseSchema),
  resources: z.array(ResourceResponseSchema),
});
