/**
 * Reminder Group Updated Event
 * 
 * Triggered when: Reminder group properties are updated
 * Subscribers: Reminder grouping service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface ReminderGroupUpdatedEvent {
  /** List of fields that were changed */
  changes: string[];
}
