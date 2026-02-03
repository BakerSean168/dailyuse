/**
 * Task Created Event
 * 
 * Triggered when: Task instance is created from template
 * Subscribers: User statistics, Task tracking service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface TaskCreatedEvent {
  /** Task template identifier */
  templateId: string;

  /** Associated goal identifier (if any) */
  goalId: string | null;
}
