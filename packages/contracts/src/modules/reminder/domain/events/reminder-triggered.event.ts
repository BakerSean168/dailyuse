/**
 * Reminder Triggered Event
 * 
 * Triggered when: Reminder is sent to user
 * Subscribers: User notification service, Reminder statistics
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface ReminderTriggeredEvent {
  /** Reminder template unique identifier */
  templateId: string;

  /** Reminder group unique identifier */
  groupId: string;
}
