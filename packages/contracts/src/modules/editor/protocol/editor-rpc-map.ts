import type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
} from '../api/api-requests';
import type { EditorWorkspaceClientDTO } from '../aggregates/editor-workspace-client';

export type EditorRpcMap = {
  'editor:create-workspace': [CreateEditorWorkspaceRequest, EditorWorkspaceClientDTO];
  'editor:update-workspace': [
    { workspaceId: string; data: UpdateEditorWorkspaceRequest },
    EditorWorkspaceClientDTO,
  ];
  'editor:get-workspace': [{ workspaceId: string }, EditorWorkspaceClientDTO];
};
