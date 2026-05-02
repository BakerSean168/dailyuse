import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Failed Event
 *
 * Triggered when: A schedule task execution fails
 * Subscribers: Notification service, Alerting
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskFailedEvent {
  taskId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  error: string;
  consecutiveFailures: number;
}
