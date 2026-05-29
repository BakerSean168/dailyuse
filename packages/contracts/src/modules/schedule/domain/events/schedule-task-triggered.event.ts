import type { ScheduleTaskId } from '../../../../primitives';
import type { SourceModule } from '../../value-objects';

/**
 * ScheduleTask Triggered Event
 *
 * Triggered when: A schedule task fires and is about to execute
 * Subscribers: Source module handler, Analytics
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskTriggeredEvent {
  taskId: ScheduleTaskId;
  taskName: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  executionTime: number;
  metadata: Record<string, unknown>;
}
