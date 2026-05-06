/**
 * EditorTab Entity - Client Interface
 */

import type {
  EditorTabId,
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  ResourceId,
  TransferDate,
} from '../../../primitives';
import type { TabType } from '../value-objects/tab-type';
import type { EditorTabServerDTO } from './editor-tab-server';

// Value object imports
import type { TabViewStateDTO } from '../value-objects';

/**
 * Editor Tab Client DTO (includes UI formatted fields).
 */
export interface EditorTabClientDTO {
  id: EditorTabId;
  groupId: EditorGroupId;
  sessionId: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  resourceId: ResourceId | null;
  tabIndex: number;
  tabType: TabType;
  name: string;
  viewState: TabViewStateDTO;
  isPinned: boolean;
  isActive: boolean;
  isDirty: boolean;
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted fields
  formattedLastAccessed: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
