/**
 * Sync Conflict Resolved Event
 * 
 * Triggered when: Sync conflict is resolved
 * Subscribers: Sync completion handlers
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SyncConflictResolvedEvent {
  /** Conflicting entity identifier */
  entityId: string;

  /** Resolution method (server-wins, client-wins, merge, etc) */
  resolution: string;
}
