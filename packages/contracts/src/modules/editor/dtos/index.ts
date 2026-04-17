import type { EditorWorkspaceClientDTO } from '../aggregates/editor-workspace-client';
import type { EditorSessionClientDTO } from '../entities/editor-session-client';

export interface EditorWorkspaceWithSessionsDTO {
  workspace: EditorWorkspaceClientDTO;
  sessions: EditorSessionClientDTO[];
}
