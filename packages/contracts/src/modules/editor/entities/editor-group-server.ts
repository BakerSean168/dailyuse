/**
 * EditorGroup Entity - Server Interface
 */

import type {
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { EditorGroupClientDTO } from './editor-group-client';

// Entity imports
import type { EditorTabServerDTO, EditorTabPersistenceDTO } from './editor-tab-server';

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

/**
 * Editor Group Persistence DTO (database fields, snake_case).
 */
export interface EditorGroupPersistenceDTO {
  id: EditorGroupId;
  session_id: EditorSessionId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  group_index: number;
  active_tab_index: number;
  name: string | null;

  // Child entities: tab list (JSON storage)
  tabs?: EditorTabPersistenceDTO[]; // Uses PersistenceDTO type

  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
