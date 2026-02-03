/**
 * Sync Failed Event
 * 
 * Triggered when: Sync session fails
 * Subscribers: Error handlers, Retry service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SyncFailedEvent {
  /** Error reason */
  reason: string;
}
