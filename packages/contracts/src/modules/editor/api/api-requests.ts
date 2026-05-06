/**
 * Editor Module - API Request/Response DTOs
 * 编辑器模块 - API 请求/响应 DTO
 *
 * Request types are re-exported from Zod-inferred types (dto files).
 * Response types that have no Zod schema are defined here.
 */

import type { ProjectType } from '../value-objects/project-type';
import type { TabType } from '../value-objects/tab-type';
import type { ResourceLanguage } from '../value-objects/resource-language';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';

import type {
  EditorWorkspaceId,
  EditorSessionId,
  EditorGroupId,
  EditorTabId,
  ResourceVersionId,
  SearchEngineId,
  LinkedResourceId,
  ResourceId,
} from '../../../primitives';

// ============ Request Type Aliases (canonical: Zod dto files) ============

export type {
  CreateEditorWorkspaceReq as CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceReq as UpdateEditorWorkspaceRequest,
} from './editor-workspace.dto';

export type {
  CreateEditorSessionReq as CreateEditorSessionRequest,
  UpdateEditorSessionReq as UpdateEditorSessionRequest,
  CreateEditorGroupReq as CreateEditorGroupRequest,
  UpdateEditorGroupReq as UpdateEditorGroupRequest,
  CreateEditorTabReq as CreateEditorTabRequest,
  UpdateEditorTabReq as UpdateEditorTabRequest,
} from './editor-runtime.dto';

// ============ Unique Request Types (no Zod schema) ============

/**
 * 创建搜索引擎请求
 */
export interface CreateSearchEngineRequest {
  workspaceId: EditorWorkspaceId;
  name: string;
  description?: string | null;
  indexPath: string;
}

/**
 * 索引进度更新请求
 */
export interface UpdateSearchEngineProgressRequest {
  indexedResourceCount: number;
  totalResourceCount: number;
  indexProgress: number;
}

/**
 * 搜索请求
 */
export interface SearchRequest {
  searchEngineId?: SearchEngineId;
  workspaceId?: EditorWorkspaceId;
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    resourceIds?: string[];
    languages?: ResourceLanguage[];
    tags?: string[];
  } | null;
}

/**
 * 创建链接资源请求
 */
export interface CreateLinkedResourceRequest {
  workspaceId: EditorWorkspaceId;
  sourceResourceId: ResourceId;
  sourceType: LinkedSourceType;
  sourceLine?: number | null;
  sourceColumn?: number | null;
  targetPath: string;
  targetType: LinkedTargetType;
  targetResourceId?: ResourceId | null;
  targetAnchor?: string | null;
}

/**
 * 更新链接资源请求
 */
export interface UpdateLinkedResourceRequest {
  targetPath?: string;
  targetResourceId?: ResourceId | null;
  targetAnchor?: string | null;
  isValid?: boolean;
}

/**
 * 验证链接请求
 */
export interface ValidateLinksRequest {
  workspaceId: EditorWorkspaceId;
  resourceIds?: ResourceId[] | null; // 如果为空，验证所有资源
}

// ============ Response Types (no Zod schema) ============

/**
 * 工作区列表响应
 */
export interface ListEditorWorkspacesResponse {
  workspaces: Array<{
    id: EditorWorkspaceId;
    name: string;
    projectPath: string;
    projectType: ProjectType;
    isActive: boolean;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

/**
 * 会话列表响应
 */
export interface ListEditorSessionsResponse {
  sessions: Array<{
    id: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    name: string;
    isActive: boolean;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

/**
 * 资源版本列表响应
 */
export interface ListResourceVersionsResponse {
  versions: Array<{
    id: ResourceVersionId;
    resourceId: ResourceId;
    versionNumber: number;
    changeType: string;
    contentHash: string;
    changeDescription?: string | null;
    createdBy?: string | null;
    createdAt: number;
  }>;
  total: number;
}

/**
 * 编辑器分组列表响应
 */
export interface ListEditorGroupsResponse {
  groups: Array<{
    id: EditorGroupId;
    sessionId: EditorSessionId;
    groupIndex: number;
    activeTabIndex: number;
    name?: string | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

/**
 * 编辑器标签列表响应
 */
export interface ListEditorTabsResponse {
  tabs: Array<{
    id: EditorTabId;
    groupId: EditorGroupId;
    sessionId: EditorSessionId;
    resourceId?: ResourceId | null;
    tabIndex: number;
    tabType: TabType;
    title: string;
    isPinned: boolean;
    isDirty: boolean;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

/**
 * 搜索结果响应
 */
export interface SearchResponse {
  results: Array<{
    resourceId: ResourceId;
    resourcePath: string;
    resourceName: string;
    snippet: string;
    score: number;
    highlights: Array<{
      line: number;
      text: string;
    }>;
  }>;
  total: number;
}

/**
 * 链接资源列表响应
 */
export interface ListLinkedResourcesResponse {
  resources: Array<{
    id: LinkedResourceId;
    sourceResourceId: ResourceId;
    sourceType: LinkedSourceType;
    targetPath: string;
    targetType: LinkedTargetType;
    isValid: boolean;
    lastValidatedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

/**
 * 验证链接响应
 */
export interface ValidateLinksResponse {
  validCount: number;
  invalidCount: number;
  invalidLinks: Array<{
    resourceId: LinkedResourceId;
    sourceResourceId: ResourceId;
    targetPath: string;
    reason: string;
  }>;
}
