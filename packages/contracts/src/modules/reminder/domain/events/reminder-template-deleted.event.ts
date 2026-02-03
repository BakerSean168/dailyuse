/**
 * Reminder Template Deleted Event
 * 
 * Triggered when: Reminder template is deleted
 * Subscribers: Cleanup services, Audit log
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface ReminderTemplateDeletedEvent {
  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
