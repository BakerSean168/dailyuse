/**
 * Editor Module Value Objects - Domain Server
 * 
 * 从 @dailyuse/domain-shared 重新导出值对象
 */

// IDs
export {
  EditorWorkspaceId,
  EditorSessionId,
  EditorGroupId,
  EditorTabId,
} from '../../domain-shared/value-objects';

// Enum-like Value Objects
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
} from '../../domain-shared/value-objects';

// Class-type Value Objects
export {
  WorkspaceLayout,
  WorkspaceSettings,
  SessionLayout,
  TabViewState,
  DocumentMetadata,
} from '../../domain-shared/value-objects';
