/**
 * Editor - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { EditorWorkspaceId, DocumentId } from '@/primitives';

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

/**
 * Document Response Schema
 */
export const DocumentResponseSchema = z.object({
  id: brandedId<DocumentId>(),
  workspaceId: brandedId<EditorWorkspaceId>(),
  path: z.string(),
  name: z.string(),
  language: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
