/**
 * Editor Module Value Objects - Domain Server
 *
 * IDs and class-type VOs only. Enum-like VOs (ProjectType, DocumentLanguage, etc.)
 * and types (WorkspaceLayout, WorkspaceSettings) come from @dailyuse/contracts/editor.
 */

// IDs
export {
  EditorWorkspaceId,
  EditorSessionId,
  EditorGroupId,
  EditorTabId,
} from '../../domain-shared/value-objects';

// Class-type Value Objects (no conflict with contracts)
export {
  SessionLayout,
  TabViewState,
  DocumentMetadata,
} from '../../domain-shared/value-objects';
