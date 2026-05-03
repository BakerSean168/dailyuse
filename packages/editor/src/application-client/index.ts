// ===== Port Interfaces =====
export type {
  IEditorApiClient,
  EditorContentReadResult,
  SaveEditorContentRequest,
} from './ports/editor-api-client.port';
export type { EditorClientPort } from './editor-client.port';

// ===== Client Service =====
export { EditorClientService, createEditorClientService } from './editor-client-service';
