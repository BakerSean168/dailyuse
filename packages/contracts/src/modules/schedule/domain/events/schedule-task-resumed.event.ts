import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Resumed Event
 *
 * Triggered when: A paused schedule task is resumed
 * Subscribers: Notification service
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskResumedEvent {
  taskId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  nextRunAt: number;
}
