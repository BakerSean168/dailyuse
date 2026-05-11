/**
 * Editor Workspace Aggregate Root - Server Interface
 */

import type {
  EditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
import type { ProjectType } from '../value-objects/project-type';

import type { WorkspaceLayoutDTO, WorkspaceSettingsDTO } from '../value-objects';

import type { EditorSessionServerDTO } from '../entities/editor-session-server';

// ============ DTO Definitions ============

/**
 * Editor Workspace Server DTO
 */
export interface EditorWorkspaceServerDTO {
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  // Associated project
  projectPath: string;
  projectType: ProjectType;

  // Workspace configuration
  layout: WorkspaceLayoutDTO;
  settings: WorkspaceSettingsDTO;

  // Child entities: session list
  sessions: EditorSessionServerDTO[];

  // Status
  isActive: boolean;
  lastActiveSessionId: EditorSessionId | null;

  // Timestamps use TransferDate
  lastAccessedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
