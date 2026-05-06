import type { ScheduleTaskId } from '../../../../primitives';
import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Created Event
 *
 * Triggered when: A new schedule task is created
 * Subscribers: Notification service, Analytics
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskCreatedEvent {
  taskId: ScheduleTaskId;
  name: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  cronExpression: string;
  nextRunAt: number;
}
