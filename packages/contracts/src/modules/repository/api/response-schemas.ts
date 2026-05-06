/**
 * Repository - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { RepositoryId, ResourceId, IdentityId, FolderId, BookmarkId } from '../../../primitives';

/**
 * Folder Metadata Schema
 */
const FolderMetadataSchema = z.object({
  icon: z.string().optional(),
  color: z.string().optional(),
});

const FolderResponseBaseSchema = z.object({
  id: brandedId<FolderId>(),
  repositoryId: brandedId<RepositoryId>(),
  parentId: brandedId<FolderId>().nullable(),
  name: z.string(),
  path: z.string(),
  order: z.number(),
  isExpanded: z.boolean(),
  metadata: FolderMetadataSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  depth: z.number(),
  isRoot: z.boolean(),
  hasChildren: z.boolean(),
  pathParts: z.array(z.string()),
  displayName: z.string(),
  createdAtText: z.string(),
  updatedAtText: z.string(),
});

/**
 * Folder Response Schema
 */
export const FolderResponseSchema: z.ZodTypeAny = z.lazy(() =>
  FolderResponseBaseSchema.extend({
    children: z.array(FolderResponseSchema).nullable().optional(),
  }),
);

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
  id: brandedId<BookmarkId>(),
  resourceId: brandedId<ResourceId>(),
  identityId: brandedId<IdentityId>(),
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

export const DeleteResourceBookmarkResultSchema = z.object({
  ok: z.boolean(),
});
