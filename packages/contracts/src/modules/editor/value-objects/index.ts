/**
 * Editor Value Objects
 * 编辑器值对象导出
 */

// ============ Enum Value Objects ============
export { ProjectType } from './project-type';
export { DocumentLanguage } from './document-language';
export { VersionChangeType } from './version-change-type';
export { TabType } from './tab-type';
export { SplitDirection } from './split-direction';
export { IndexStatus } from './index-status';
export { LinkedSourceType } from './linked-source-type';
export { LinkedTargetType } from './linked-target-type';
export { ViewMode } from './view-mode';
export { SidebarActiveTab } from './sidebar-active-tab';

// ============ Complex Value Objects ============
export type {
  IWorkspaceLayoutServer,
  IWorkspaceLayoutClient,
  WorkspaceLayoutServerDTO,
  WorkspaceLayoutClientDTO,
  WorkspaceLayoutPersistenceDTO,
  WorkspaceLayoutServer,
  WorkspaceLayoutClient,
} from './workspace-layout';
export { DEFAULT_WORKSPACE_LAYOUT } from './workspace-layout';

export type {
  IWorkspaceSettingsServer,
  IWorkspaceSettingsClient,
  WorkspaceSettingsServerDTO,
  WorkspaceSettingsClientDTO,
  WorkspaceSettingsPersistenceDTO,
  WorkspaceSettingsServer,
  WorkspaceSettingsClient,
} from './workspace-settings';
export { DEFAULT_WORKSPACE_SETTINGS } from './workspace-settings';

export type {
  ISessionLayoutServer,
  ISessionLayoutClient,
  SessionLayoutServerDTO,
  SessionLayoutClientDTO,
  SessionLayoutPersistenceDTO,
  SessionLayoutServer,
  SessionLayoutClient,
} from './session-layout';
export { DEFAULT_SESSION_LAYOUT } from './session-layout';

export type {
  ITabViewStateServer,
  ITabViewStateClient,
  TabViewStateServerDTO,
  TabViewStateClientDTO,
  TabViewStatePersistenceDTO,
  TabViewStateServer,
  TabViewStateClient,
} from './tab-view-state';

export type {
  IDocumentMetadataServer,
  IDocumentMetadataClient,
  DocumentMetadataServerDTO,
  DocumentMetadataClientDTO,
  DocumentMetadataPersistenceDTO,
  DocumentMetadataServer,
  DocumentMetadataClient,
} from './document-metadata';
