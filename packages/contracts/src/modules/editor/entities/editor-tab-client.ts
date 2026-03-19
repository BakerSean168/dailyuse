/**
 * EditorTab Entity - Client Interface
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
import type { EditorTabServerDTO } from './editor-tab-server';

// Value object imports
import type { TabViewStateClientDTO } from '../value-objects';

/**
 * Editor Tab Client DTO (includes UI formatted fields).
 */
export interface EditorTabClientDTO {
  id: string;
  groupId: string;
  sessionId: string;
  workspaceId: string;
  identityId: string;
  resourceId: string | null;
  tabIndex: number;
  tabType: TabType;
  name: string;
  viewState: TabViewStateClientDTO;
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
