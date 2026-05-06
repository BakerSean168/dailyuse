import type { ResourceId } from '../../../../primitives';

/**
 * Editor Resource Saved Event
 *
 * Triggered when: An editor resource is saved
 * Subscribers: Editor service
 *
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface EditorResourceSavedDomainEvent {
  /** The ID of the saved resource */
  resourceId: ResourceId;
}
