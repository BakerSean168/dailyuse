/**
 * Editor Workspace Aggregate Root - Client Interface
 */

import type {
  EditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { ProjectType } from '../value-objects/project-type';

// Value object imports
import type { WorkspaceLayoutClientDTO, WorkspaceSettingsClientDTO } from '../value-objects';
import type { EditorWorkspaceServerDTO } from './editor-workspace-server';

// Entity imports
import type { EditorSessionClientDTO } from '../entities/editor-session-client';

// ============ DTO Definitions ============

/**
 * Editor Workspace Client DTO
 */
export interface EditorWorkspaceClientDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

  projectPath: string;
  projectType: ProjectType;

  layout: WorkspaceLayoutClientDTO;
  settings: WorkspaceSettingsClientDTO;

  // Child entities: session list
  sessions: EditorSessionClientDTO[];

  isActive: boolean;
  lastActiveSessionId: string | null;

  // Timestamps use TransferDate
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted properties
  formattedLastAccessed: string | null; // e.g. "2 hours ago"
  formattedCreatedAt: string; // e.g. "2024-10-10"
  formattedUpdatedAt: string; // e.g. "just now"
}
