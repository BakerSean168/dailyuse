/**
 * Editor Workspace Aggregate Root - Server Interface
 */

import type {
  EditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { ProjectType } from '../value-objects/project-type';

import type { WorkspaceLayoutServerDTO, WorkspaceSettingsServerDTO } from '../value-objects';

import type { EditorSessionServerDTO } from '../entities/editor-session-server';

// ============ Type Aliases (backward compatibility) ============

/**
 * Workspace layout type alias.
 * @deprecated Use WorkspaceLayoutServerDTO instead.
 */
export type WorkspaceLayout = WorkspaceLayoutServerDTO;

/**
 * Workspace settings type alias.
 * @deprecated Use WorkspaceSettingsServerDTO instead.
 */
export type WorkspaceSettings = WorkspaceSettingsServerDTO;

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
  layout: WorkspaceLayoutServerDTO;
  settings: WorkspaceSettingsServerDTO;

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

/**
 * Editor Workspace Persistence DTO (database mapping).
 */
export interface EditorWorkspacePersistenceDTO {
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  project_path: string;
  project_type: ProjectType;

  layout: string; // JSON string
  settings: string; // JSON string

  is_active: boolean;
  last_active_session_id: EditorSessionId | null;

  lastAccessedAt: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ Domain Events ============

/** Workspace created event. */
export interface EditorWorkspaceCreatedEvent {
  type: 'editor.workspace.created';
  aggregateId: string; // workspaceId
  timestamp: DomainDate;
  payload: {
    workspace: EditorWorkspaceServerDTO;
    createDefaultSession: boolean;
  };
}

/** Workspace updated event. */
export interface EditorWorkspaceUpdatedEvent {
  type: 'editor.workspace.updated';
  aggregateId: string;
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
  aggregateId: string;
  timestamp: DomainDate;
  payload: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
  };
}

/** Workspace activated event. */
export interface EditorWorkspaceActivatedEvent {
  type: 'editor.workspace.activated';
  aggregateId: string;
  timestamp: DomainDate;
  payload: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
  };
}
