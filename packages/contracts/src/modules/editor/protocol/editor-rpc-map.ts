import type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../api';
import type { EditorWorkspaceClientDTO } from '../aggregates';
import type { DocumentClientDTO } from '../entities';

export type EditorRpcMap = {
  'editor:create-workspace': [CreateEditorWorkspaceRequest, EditorWorkspaceClientDTO];
  'editor:update-workspace': [{ workspaceId: string; data: UpdateEditorWorkspaceRequest }, EditorWorkspaceClientDTO];
  'editor:get-workspace': [{ workspaceId: string }, EditorWorkspaceClientDTO];
  'editor:create-document': [CreateDocumentRequest, DocumentClientDTO];
  'editor:update-document': [{ documentId: string; data: UpdateDocumentRequest }, DocumentClientDTO];
  'editor:get-document': [{ documentId: string }, DocumentClientDTO];
};
