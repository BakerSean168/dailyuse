/**
 * Editor Workspace Updated Event
 *
 * Triggered when: Workspace settings or metadata are updated
 * Subscribers: Editor service
 *
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface EditorWorkspaceUpdatedDomainEvent {
  /** The fields that were changed in this update */
  changedFields: string[];
}
