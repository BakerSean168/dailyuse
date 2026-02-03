/**
 * Task Rescheduled Event
 * 
 * Triggered when: Task due date is changed
 * Subscribers: Task scheduler, User notifications
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface TaskRescheduledEvent {
  /** Previous due date */
  previousDueDate: number;

  /** New due date */
  newDueDate: number;
}
