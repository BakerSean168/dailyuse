import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Completed Event
 *
 * Triggered when: A schedule task reaches completion (maxExecutions met)
 * Subscribers: Notification service, Analytics
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskCompletedEvent {
  taskId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  totalExecutions: number;
}
