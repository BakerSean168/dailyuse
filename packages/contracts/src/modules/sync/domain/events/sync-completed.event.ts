/**
 * Sync Completed Event
 * 
 * Triggered when: Sync session completes successfully
 * Subscribers: Sync completion handlers
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SyncCompletedEvent {
  /** Total items synced */
  totalSynced: number;
}
