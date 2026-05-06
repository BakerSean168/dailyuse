import type { EditorWorkspaceId } from '../../../primitives';
import type { EditorWorkspaceClientDTO } from '../aggregates/editor-workspace-client';
import type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
} from '../api';

export type EditorRpcMap = {
  'editor:create-workspace': [CreateEditorWorkspaceRequest, EditorWorkspaceClientDTO];
  'editor:update-workspace': [
    { workspaceId: EditorWorkspaceId; data: UpdateEditorWorkspaceRequest },
    EditorWorkspaceClientDTO,
  ];
  'editor:get-workspace': [{ workspaceId: EditorWorkspaceId }, EditorWorkspaceClientDTO];
};
