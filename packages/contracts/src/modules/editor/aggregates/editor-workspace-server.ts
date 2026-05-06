/**
 * Editor Workspace Aggregate Root - Server Interface
 */

import type {
  EditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
  DomainDate,
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

// ============ Domain Events ============

/** Workspace created event. */
export interface EditorWorkspaceCreatedEvent {
  type: 'editor.workspace.created';
  aggregateId: EditorWorkspaceId;
  timestamp: DomainDate;
  payload: {
    workspace: EditorWorkspaceServerDTO;
    createDefaultSession: boolean;
  };
}

/** Workspace updated event. */
export interface EditorWorkspaceUpdatedEvent {
  type: 'editor.workspace.updated';
  aggregateId: EditorWorkspaceId;
  timestamp: DomainDate;
  payload: {
    workspace: EditorWorkspaceServerDTO;
    previousData: Partial<EditorWorkspaceServerDTO>;
    changes: string[];
  };
}

/** Workspace deleted event. */
export interface EditorWorkspaceDeletedEvent {
  type: 'editor.workspace.deleted';
  aggregateId: EditorWorkspaceId;
  timestamp: DomainDate;
  payload: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
  };
}

/** Workspace activated event. */
export interface EditorWorkspaceActivatedEvent {
  type: 'editor.workspace.activated';
  aggregateId: EditorWorkspaceId;
  timestamp: DomainDate;
  payload: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
  };
}
