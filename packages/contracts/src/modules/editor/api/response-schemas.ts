/**
 * Editor - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { EditorWorkspaceId } from '../../../primitives';

/**
 * Workspace Response Schema
 */
export const WorkspaceResponseSchema = z.object({
  id: brandedId<EditorWorkspaceId>(),
  name: z.string(),
  projectPath: z.string(),
  projectType: z.string(),
  isActive: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const SearchResponseSchema = z.object({
  results: z.array(
    z.object({
      resourceId: z.string(),
      resourcePath: z.string(),
      resourceName: z.string(),
      snippet: z.string(),
      score: z.number(),
      highlights: z.array(
        z.object({
          line: z.number().int().positive(),
          text: z.string(),
        }),
      ),
    }),
  ),
  total: z.number().int().min(0),
});
