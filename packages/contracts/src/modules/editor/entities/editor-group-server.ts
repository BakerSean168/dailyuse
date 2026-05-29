/**
 * EditorGroup Entity - Server Interface
 */

import type {
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
// Entity imports
import type { EditorTabServerDTO } from './editor-tab-server';

/**
 * Editor Group Server DTO
 */
export interface EditorGroupServerDTO {
  id: EditorGroupId;
  sessionId: EditorSessionId; // Parent session ID
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  groupIndex: number; // Group index (position within session)
  activeTabIndex: number; // Currently active tab index
  name: string | null; // Group name (optional)

  // Child entities: tab list
  tabs: EditorTabServerDTO[];

  createdAt: TransferDate;
  updatedAt: TransferDate;
}

