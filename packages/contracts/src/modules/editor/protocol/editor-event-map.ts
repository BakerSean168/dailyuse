import type { EditorWorkspaceUpdatedDomainEvent } from '../domain/events/editor-workspace-updated.event';
import type { EditorResourceSavedDomainEvent } from '../domain/events/editor-resource-saved.event';

export type EditorEventMap = {
  'editor:EditorWorkspaceUpdatedEvent': EditorWorkspaceUpdatedDomainEvent;
  'editor:EditorResourceSavedEvent': EditorResourceSavedDomainEvent;
};
