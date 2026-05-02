import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Cancelled Event
 *
 * Triggered when: A schedule task is explicitly cancelled
 * Subscribers: Notification service
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskCancelledEvent {
  taskId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  reason: string;
}
