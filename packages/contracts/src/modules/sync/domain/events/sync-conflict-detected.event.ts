/**
 * Sync Conflict Detected Event
 * 
 * Triggered when: Conflicting changes are detected during sync
 * Subscribers: Conflict resolution service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SyncConflictDetectedEvent {
  /** Conflicting entity identifier */
  entityId: string;
}
