import type {
  EditorWorkspaceUpdatedDomainEvent,
  EditorDocumentSavedDomainEvent,
} from '../domain/events';

export type EditorEventMap = {
  'editor:EditorWorkspaceUpdatedEvent': EditorWorkspaceUpdatedDomainEvent;
  'editor:EditorDocumentSavedEvent': EditorDocumentSavedDomainEvent;
};
