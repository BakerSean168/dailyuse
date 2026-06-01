/**
 * Editor Workspace Aggregate Root - Client Interface
 */

import type {
  EditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
import type { ProjectType } from '../value-objects/project-type';

// Value object imports
import type { WorkspaceLayoutDTO, WorkspaceSettingsDTO } from '../value-objects';

// Entity imports
import type { EditorSessionClientDTO } from '../entities/editor-session-client';

// ============ DTO Definitions ============

/**
 * Editor Workspace Client DTO
 */
export interface EditorWorkspaceClientDTO {
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  projectPath: string;
  projectType: ProjectType;

  layout: WorkspaceLayoutDTO;
  settings: WorkspaceSettingsDTO;

  // Child entities: session list
  sessions: EditorSessionClientDTO[];

  isActive: boolean;
  lastActiveSessionId: EditorSessionId | null;

  // Timestamps use TransferDate
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted properties
  formattedLastAccessed: string | null; // e.g. "2 hours ago"
  formattedCreatedAt: string; // e.g. "2024-10-10"
  formattedUpdatedAt: string; // e.g. "just now"
}
