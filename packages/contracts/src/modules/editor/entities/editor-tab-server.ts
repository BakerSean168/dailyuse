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
} from '../../../primitives';
import type { TabType } from '../value-objects/tab-type';
import type { EditorTabClientDTO } from './editor-tab-client';

// Value object imports
import type { TabViewStateDTO } from '../value-objects';

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
  viewState: TabViewStateDTO;
  isPinned: boolean;
  isActive: boolean;
  isDirty: boolean; // Whether there are unsaved changes
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

