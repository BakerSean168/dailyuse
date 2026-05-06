/**
 * EditorGroup Entity - Client Interface
 */

import type {
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { EditorGroupServerDTO } from './editor-group-server';

// Entity imports
import type { EditorTabClientDTO } from './editor-tab-client';

/**
 * Editor Group Client DTO (includes UI formatted fields).
 */
export interface EditorGroupClientDTO {
  id: EditorGroupId;
  sessionId: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  groupIndex: number;
  activeTabIndex: number;
  name: string | null;

  // Child entities: tab list
  tabs: EditorTabClientDTO[];

  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted fields
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
