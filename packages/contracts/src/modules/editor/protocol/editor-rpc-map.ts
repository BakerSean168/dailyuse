import type { CreateEditorWorkspaceRequest, UpdateEditorWorkspaceRequest } from '../api';
import type { EditorWorkspaceClientDTO } from '../aggregates';

export type EditorRpcMap = {
  'editor:create-workspace': [CreateEditorWorkspaceRequest, EditorWorkspaceClientDTO];
  'editor:update-workspace': [
    { workspaceId: string; data: UpdateEditorWorkspaceRequest },
    EditorWorkspaceClientDTO,
  ];
  'editor:get-workspace': [{ workspaceId: string }, EditorWorkspaceClientDTO];
};
