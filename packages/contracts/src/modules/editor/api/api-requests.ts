/**
 * Editor Module - API Request/Response DTOs
 * 编辑器模块 - API 请求/响应 DTO
 */

import type {
  ProjectType,
  DocumentLanguage,
  TabType,
  LinkedSourceType,
  LinkedTargetType,
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
  SessionLayoutServerDTO,
  TabViewStateServerDTO,
  DocumentMetadataServerDTO,
} from '../value-objects';

// ==================== EditorWorkspace API DTOs ====================

/**
 * 创建工作区请求
 */
export interface CreateEditorWorkspaceRequest {
  name: string;
  description?: string | null;
  projectPath: string;
  projectType: ProjectType;
  layout?: Partial<WorkspaceLayoutServerDTO> | null;
  settings?: Partial<WorkspaceSettingsServerDTO> | null;
}

/**
 * 更新工作区请求
 */
export interface UpdateEditorWorkspaceRequest {
  name?: string;
  description?: string | null;
  layout?: Partial<WorkspaceLayoutServerDTO> | null;
  settings?: Partial<WorkspaceSettingsServerDTO> | null;
}

/**
 * 工作区列表响应
 */
export interface ListEditorWorkspacesResponse {
  workspaces: Array<{
    id: string;
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
  workspaceId: string;
  name: string;
  description?: string | null;
  layout?: Partial<SessionLayoutServerDTO> | null;
}

/**
 * 更新会话请求
 */
export interface UpdateEditorSessionRequest {
  name?: string;
  description?: string | null;
  layout?: Partial<SessionLayoutServerDTO> | null;
  activeGroupIndex?: number;
}

/**
 * 会话列表响应
 */
export interface ListEditorSessionsResponse {
  sessions: Array<{
    id: string;
    workspaceId: string;
    name: string;
    isActive: boolean;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

// ==================== Document API DTOs ====================

/**
 * 创建文档请求
 */
export interface CreateDocumentRequest {
  workspaceId: string;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  metadata?: Partial<DocumentMetadataServerDTO> | null;
}

/**
 * 更新文档请求
 */
export interface UpdateDocumentRequest {
  content?: string;
  metadata?: Partial<DocumentMetadataServerDTO> | null;
}

/**
 * 文档列表响应
 */
export interface ListDocumentsResponse {
  documents: Array<{
    id: string;
    workspaceId: string;
    path: string;
    name: string;
    language: DocumentLanguage;
    contentHash: string;
    indexStatus: string;
    lastModifiedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
  total: number;
}

// ==================== DocumentVersion API DTOs ====================

/**
 * 文档版本列表响应
 */
export interface ListDocumentVersionsResponse {
  versions: Array<{
    id: string;
    documentId: string;
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
  sessionId: string;
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
    id: string;
    sessionId: string;
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
  groupId: string;
  sessionId: string;
  documentId?: string | null;
  tabIndex: number;
  tabType: TabType;
  title: string;
  viewState?: Partial<TabViewStateServerDTO> | null;
}

/**
 * 更新编辑器标签请求
 */
export interface UpdateEditorTabRequest {
  title?: string;
  viewState?: Partial<TabViewStateServerDTO> | null;
  isPinned?: boolean;
  isDirty?: boolean;
}

/**
 * 编辑器标签列表响应
 */
export interface ListEditorTabsResponse {
  tabs: Array<{
    id: string;
    groupId: string;
    sessionId: string;
    documentId?: string | null;
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
  workspaceId: string;
  name: string;
  description?: string | null;
  indexPath: string;
}

/**
 * 索引进度更新请求
 */
export interface UpdateSearchEngineProgressRequest {
  indexedDocumentCount: number;
  totalDocumentCount: number;
  indexProgress: number;
}

/**
 * 搜索请求
 */
export interface SearchRequest {
  searchEngineId: string;
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    documentIds?: string[];
    languages?: DocumentLanguage[];
    tags?: string[];
  } | null;
}

/**
 * 搜索结果响应
 */
export interface SearchResponse {
  results: Array<{
    documentId: string;
    documentPath: string;
    documentName: string;
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
  workspaceId: string;
  sourceDocumentId: string;
  sourceType: LinkedSourceType;
  sourceLine?: number | null;
  sourceColumn?: number | null;
  targetPath: string;
  targetType: LinkedTargetType;
  targetDocumentId?: string | null;
  targetAnchor?: string | null;
}

/**
 * 更新链接资源请求
 */
export interface UpdateLinkedResourceRequest {
  targetPath?: string;
  targetDocumentId?: string | null;
  targetAnchor?: string | null;
  isValid?: boolean;
}

/**
 * 链接资源列表响应
 */
export interface ListLinkedResourcesResponse {
  resources: Array<{
    id: string;
    sourceDocumentId: string;
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
  workspaceId: string;
  documentIds?: string[] | null; // 如果为空，验证所有文档
}

/**
 * 验证链接响应
 */
export interface ValidateLinksResponse {
  validCount: number;
  invalidCount: number;
  invalidLinks: Array<{
    resourceId: string;
    sourceDocumentId: string;
    targetPath: string;
    reason: string;
  }>;
}
