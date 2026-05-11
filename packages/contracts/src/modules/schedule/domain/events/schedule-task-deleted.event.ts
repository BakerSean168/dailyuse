/**
 * ScheduleTask Deleted Event
 *
 * Triggered when: A schedule task is deleted
 * Subscribers: Task, Reminder, Goal modules (cleanup)
 *
 * Note: aggregateId is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskDeletedEvent {
  readonly taskId: string;
}
