/**
 * Editor Module - API Request/Response DTOs
 * 编辑器模块 - API 请求/响应 DTO
 */

import type { ProjectType } from '../value-objects/project-type';
import type { TabType } from '../value-objects/tab-type';
import type { ResourceLanguage } from '../value-objects/resource-language';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';
import type { WorkspaceLayoutDTO } from '../value-objects/workspace-layout';
import type { WorkspaceSettingsDTO } from '../value-objects/workspace-settings';
import type { SessionLayoutDTO } from '../value-objects/session-layout';
import type { TabViewStateDTO } from '../value-objects/tab-view-state';

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

// ==================== EditorWorkspace API DTOs ====================

/**
 * 创建工作区请求
 */
export interface CreateEditorWorkspaceRequest {
  name: string;
  description?: string | null;
  projectPath: string;
  projectType: ProjectType;
  layout?: Partial<WorkspaceLayoutDTO> | null;
  settings?: Partial<WorkspaceSettingsDTO> | null;
}

/**
 * 更新工作区请求
 */
export interface UpdateEditorWorkspaceRequest {
  name?: string;
  description?: string | null;
  layout?: Partial<WorkspaceLayoutDTO> | null;
  settings?: Partial<WorkspaceSettingsDTO> | null;
}

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

// ==================== EditorSession API DTOs ====================

/**
 * 创建会话请求
 */
export interface CreateEditorSessionRequest {
  workspaceId: EditorWorkspaceId;
  name: string;
  description?: string | null;
  layout?: Partial<SessionLayoutDTO> | null;
}

/**
 * 更新会话请求
 */
export interface UpdateEditorSessionRequest {
  name?: string;
  description?: string | null;
  layout?: Partial<SessionLayoutDTO> | null;
  activeGroupIndex?: number;
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

// ==================== ResourceVersion API DTOs ====================

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

// ==================== EditorGroup API DTOs ====================

/**
 * 创建编辑器分组请求
 */
export interface CreateEditorGroupRequest {
  sessionId: EditorSessionId;
  groupIndex: number;
  name?: string | null;
}

/**
 * 更新编辑器分组请求
 */
export interface UpdateEditorGroupRequest {
  name?: string | null;
  activeTabIndex?: number;
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

// ==================== EditorTab API DTOs ====================

/**
 * 创建编辑器标签请求
 */
export interface CreateEditorTabRequest {
  groupId: EditorGroupId;
  sessionId: EditorSessionId;
  resourceId?: string | null;
  tabIndex: number;
  tabType: TabType;
  title: string;
  viewState?: Partial<TabViewStateDTO> | null;
}

/**
 * 更新编辑器标签请求
 */
export interface UpdateEditorTabRequest {
  title?: string;
  viewState?: Partial<TabViewStateDTO> | null;
  isPinned?: boolean;
  isDirty?: boolean;
}

/**
 * 编辑器标签列表响应
 */
export interface ListEditorTabsResponse {
  tabs: Array<{
    id: EditorTabId;
    groupId: EditorGroupId;
    sessionId: EditorSessionId;
    resourceId?: string | null;
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

// ==================== SearchEngine API DTOs ====================

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
 * 搜索结果响应
 */
export interface SearchResponse {
  results: Array<{
    resourceId: string;
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

// ==================== LinkedResource API DTOs ====================

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
 * 验证链接请求
 */
export interface ValidateLinksRequest {
  workspaceId: EditorWorkspaceId;
  resourceIds?: ResourceId[] | null; // 如果为空，验证所有资源
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
