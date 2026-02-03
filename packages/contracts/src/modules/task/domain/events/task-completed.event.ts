/**
 * Task Completed Event
 * 
 * Triggered when: Task is marked as completed
 * Subscribers: User statistics, Achievement system, Goal progress
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface TaskCompletedEvent {
  /** Associated goal identifier (if any) */
  goalId: string | null;
}
