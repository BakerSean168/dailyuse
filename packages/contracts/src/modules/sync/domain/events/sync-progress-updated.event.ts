/**
 * Sync Progress Updated Event
 * 
 * Triggered when: Sync progresses
 * Subscribers: Sync status tracking, UI progress updates
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SyncProgressUpdatedEvent {
  /** Number of items processed */
  processedCount: number;

  /** Total items to process */
  totalCount: number;
}
