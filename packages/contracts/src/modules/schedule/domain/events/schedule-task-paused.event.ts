import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Paused Event
 *
 * Triggered when: A schedule task is paused
 * Subscribers: Notification service
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskPausedEvent {
  taskId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  reason?: string;
}
