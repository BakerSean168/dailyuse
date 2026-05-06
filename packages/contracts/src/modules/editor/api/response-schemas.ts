/**
 * Editor - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId, openApiJsonValue } from '../../../primitives';
import type {
  EditorWorkspaceId,
  EditorSessionId,
  EditorGroupId,
  EditorTabId,
  ResourceId,
  IdentityId,
} from '../../../primitives';
import { TabType } from '../value-objects/tab-type';

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

export const TabResponseSchema = z.object({
  id: brandedId<EditorTabId>(),
  groupId: brandedId<EditorGroupId>(),
  sessionId: brandedId<EditorSessionId>(),
  workspaceId: brandedId<EditorWorkspaceId>(),
  identityId: brandedId<IdentityId>(),
  resourceId: brandedId<ResourceId>().nullable(),
  tabIndex: z.number().int().min(0),
  tabType: z.enum(TabType),
  name: z.string(),
  viewState: z.record(z.string(), openApiJsonValue),
  isPinned: z.boolean(),
  isActive: z.boolean(),
  isDirty: z.boolean(),
  lastAccessedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  formattedLastAccessed: z.string().nullable(),
  formattedCreatedAt: z.string(),
  formattedUpdatedAt: z.string(),
});

export const GroupResponseSchema = z.object({
  id: brandedId<EditorGroupId>(),
  sessionId: brandedId<EditorSessionId>(),
  workspaceId: brandedId<EditorWorkspaceId>(),
  identityId: brandedId<IdentityId>(),
  groupIndex: z.number().int().min(0),
  activeTabIndex: z.number().int().min(0),
  name: z.string().nullable(),
  tabs: z.array(TabResponseSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
  formattedCreatedAt: z.string(),
  formattedUpdatedAt: z.string(),
});

export const SessionResponseSchema = z.object({
  id: brandedId<EditorSessionId>(),
  workspaceId: brandedId<EditorWorkspaceId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  groups: z.array(GroupResponseSchema),
  isActive: z.boolean(),
  activeGroupIndex: z.number().int().min(0),
  layout: z.record(z.string(), openApiJsonValue),
  groupCount: z.number().int().min(0),
  lastAccessedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const EditorContentResponseSchema = z.object({
  resourceId: brandedId<ResourceId>(),
  name: z.string(),
  content: z.string().nullable(),
});

export const SearchResponseSchema = z.object({
  results: z.array(
    z.object({
      resourceId: brandedId<ResourceId>(),
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
