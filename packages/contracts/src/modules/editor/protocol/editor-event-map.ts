import type {
  EditorWorkspaceUpdatedDomainEvent,
  EditorResourceSavedDomainEvent,
} from '../domain/events';

export type EditorEventMap = {
  'editor:EditorWorkspaceUpdatedEvent': EditorWorkspaceUpdatedDomainEvent;
  'editor:EditorResourceSavedEvent': EditorResourceSavedDomainEvent;
};
