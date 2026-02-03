/**
 * Task Updated Event
 * 
 * Triggered when: Task properties are modified
 * Subscribers: Task tracking, User activity log
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface TaskUpdatedEvent {
  /** List of fields that were changed */
  changes: string[];
}
