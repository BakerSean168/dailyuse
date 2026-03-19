/**
 * EditorTab Entity - Server Interface
 */

import type {
  EditorTabId,
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  PersistenceDate,
} from '../../../primitives';
import type { TabType } from '../value-objects/tab-type';
import type { EditorTabClientDTO } from './editor-tab-client';

// Value object imports
import type { TabViewStateServerDTO } from '../value-objects';

/**
 * Editor Tab Server DTO
 */
export interface EditorTabServerDTO {
  id: EditorTabId;
  groupId: EditorGroupId; // Parent group ID
  sessionId: EditorSessionId; // Parent session ID
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  resourceId: string | null; // Associated repository resource ID
  tabIndex: number; // Tab index (position within group)
  tabType: TabType;
  name: string;
  viewState: TabViewStateServerDTO;
  isPinned: boolean;
  isActive: boolean;
  isDirty: boolean; // Whether there are unsaved changes
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Editor Tab Persistence DTO (database fields, snake_case).
 */
export interface EditorTabPersistenceDTO {
  id: EditorTabId;
  group_id: EditorGroupId;
  session_id: EditorSessionId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  resource_id: string | null;
  tab_index: number;
  tab_type: TabType;
  name: string;
  view_state: string; // JSON string
  is_pinned: boolean;
  is_active: boolean;
  is_dirty: boolean;
  lastAccessedAt: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
