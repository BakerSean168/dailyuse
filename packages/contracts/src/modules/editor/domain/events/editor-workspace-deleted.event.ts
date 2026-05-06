import type { EditorWorkspaceId } from '../../../../primitives';

/**
 * Editor Workspace Deleted Event
 *
 * Triggered when: An editor workspace is deleted
 * Subscribers: Editor service
 *
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface EditorWorkspaceDeletedDomainEvent {
  /** The ID of the deleted workspace */
  workspaceId: EditorWorkspaceId;
}
