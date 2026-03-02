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
