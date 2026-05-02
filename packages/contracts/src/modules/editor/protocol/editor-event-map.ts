import type { EditorWorkspaceUpdatedDomainEvent } from '../domain/events/editor-workspace-updated.event';
import type { EditorResourceSavedDomainEvent } from '../domain/events/editor-resource-saved.event';
import type { EditorWorkspaceCreatedDomainEvent } from '../domain/events/editor-workspace-created.event';
import type { EditorWorkspaceDeletedDomainEvent } from '../domain/events/editor-workspace-deleted.event';

/**
 * Editor Module - Event Map
 * 编辑器模块 - 事件映射
 *
 * 事件命名规范：editor:{kebab-action-past-tense}
 */
export type EditorEventMap = {
  'editor:workspace-created': EditorWorkspaceCreatedDomainEvent;
  'editor:workspace-updated': EditorWorkspaceUpdatedDomainEvent;
  'editor:workspace-deleted': EditorWorkspaceDeletedDomainEvent;
  'editor:resource-saved': EditorResourceSavedDomainEvent;
};
