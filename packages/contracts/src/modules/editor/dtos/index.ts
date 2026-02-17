import type { EditorWorkspaceClientDTO } from '../aggregates';
import type { EditorSessionClientDTO } from '../entities';

export interface EditorWorkspaceWithSessionsDTO {
  workspace: EditorWorkspaceClientDTO;
  sessions: EditorSessionClientDTO[];
}
