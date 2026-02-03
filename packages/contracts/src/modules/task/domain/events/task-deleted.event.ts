/**
 * Task Deleted Event
 * 
 * Triggered when: Task is deleted
 * Subscribers: Cleanup services, Task statistics
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface TaskDeletedEvent {
  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
