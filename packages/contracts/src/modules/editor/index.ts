/**
 * Editor Module - Explicit Exports
 * 编辑器模块 - 显式导出
 */

// ============ Enums (Value Objects) ============
export {
  ProjectType,
  DocumentLanguage,
  VersionChangeType,
  TabType,
  SplitDirection,
  IndexStatus,
  LinkedSourceType,
  LinkedTargetType,
  ViewMode,
  SidebarActiveTab,
} from './value-objects';

// ============ Value Objects ============
export type {
  // WorkspaceLayout
  IWorkspaceLayoutServer,
  IWorkspaceLayoutClient,
  WorkspaceLayoutServerDTO,
  WorkspaceLayoutClientDTO,
  WorkspaceLayoutPersistenceDTO,
  WorkspaceLayoutServer,
  WorkspaceLayoutClient,
} from './value-objects/workspace-layout';
export { DEFAULT_WORKSPACE_LAYOUT } from './value-objects/workspace-layout';

export type {
  // WorkspaceSettings
  IWorkspaceSettingsServer,
  IWorkspaceSettingsClient,
  WorkspaceSettingsServerDTO,
  WorkspaceSettingsClientDTO,
  WorkspaceSettingsPersistenceDTO,
  WorkspaceSettingsServer,
  WorkspaceSettingsClient,
} from './value-objects/workspace-settings';
export { DEFAULT_WORKSPACE_SETTINGS } from './value-objects/workspace-settings';

export type {
  // SessionLayout
  ISessionLayoutServer,
  ISessionLayoutClient,
  SessionLayoutServerDTO,
  SessionLayoutClientDTO,
  SessionLayoutPersistenceDTO,
  SessionLayoutServer,
  SessionLayoutClient,
} from './value-objects/session-layout';
export { DEFAULT_SESSION_LAYOUT } from './value-objects/session-layout';

export type {
  // TabViewState
  ITabViewStateServer,
  ITabViewStateClient,
  TabViewStateServerDTO,
  TabViewStateClientDTO,
  TabViewStatePersistenceDTO,
  TabViewStateServer,
  TabViewStateClient,
} from './value-objects/tab-view-state';

export type {
  // DocumentMetadata
  IDocumentMetadataServer,
  IDocumentMetadataClient,
  DocumentMetadataServerDTO,
  DocumentMetadataClientDTO,
  DocumentMetadataPersistenceDTO,
  DocumentMetadataServer,
  DocumentMetadataClient,
} from './value-objects/document-metadata';

// ============ Aggregates ============
export type {
  EditorWorkspaceClientDTO,
  EditorWorkspaceClient,
} from './aggregates/editor-workspace-client';

export type {
  EditorWorkspaceServerDTO,
  EditorWorkspacePersistenceDTO,
  EditorWorkspaceCreatedEvent,
  EditorWorkspaceUpdatedEvent,
  EditorWorkspaceDeletedEvent,
  EditorWorkspaceActivatedEvent,
  EditorWorkspaceServer,
  WorkspaceLayout,
  WorkspaceSettings,
} from './aggregates/editor-workspace-server';

// ============ Entities ============
export type { DocumentClientDTO, DocumentClient } from './entities/document-client';

export type {
  DocumentServerDTO,
  DocumentPersistenceDTO,
  DocumentServer,
} from './entities/document-server';

export type {
  DocumentVersionClientDTO,
  DocumentVersionClient,
} from './entities/document-version-client';

export type {
  DocumentVersionServerDTO,
  DocumentVersionPersistenceDTO,
  DocumentVersionServer,
} from './entities/document-version-server';

export type { EditorSessionClientDTO } from './entities/editor-session-client';

export type {
  EditorSessionServerDTO,
  EditorSessionPersistenceDTO,
} from './entities/editor-session-server';

export type { EditorGroupClientDTO, EditorGroupClient } from './entities/editor-group-client';

export type {
  EditorGroupServerDTO,
  EditorGroupPersistenceDTO,
  EditorGroupServer,
} from './entities/editor-group-server';

export type { EditorTabClientDTO, EditorTabClient } from './entities/editor-tab-client';

export type {
  EditorTabServerDTO,
  EditorTabPersistenceDTO,
  EditorTabServer,
} from './entities/editor-tab-server';

export type { SearchEngineClientDTO, SearchEngineClient } from './entities/search-engine-client';

export type {
  SearchEngineServerDTO,
  SearchEnginePersistenceDTO,
  SearchEngineServer,
} from './entities/search-engine-server';

export type {
  LinkedResourceClientDTO,
  LinkedResourceClient,
} from './entities/linked-resource-client';

export type {
  LinkedResourceServerDTO,
  LinkedResourcePersistenceDTO,
  LinkedResourceServer,
} from './entities/linked-resource-server';

// ============ API Requests ============
export type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  ListEditorWorkspacesResponse,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  ListEditorSessionsResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  ListDocumentsResponse,
  ListDocumentVersionsResponse,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  ListEditorGroupsResponse,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
  ListEditorTabsResponse,
  CreateSearchEngineRequest,
  UpdateSearchEngineProgressRequest,
  SearchRequest,
  SearchResponse,
  CreateLinkedResourceRequest,
  UpdateLinkedResourceRequest,
  ListLinkedResourcesResponse,
  ValidateLinksRequest,
  ValidateLinksResponse,
} from './api/api-requests';
