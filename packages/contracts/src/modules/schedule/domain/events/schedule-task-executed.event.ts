import type { SourceModule, ExecutionStatus } from '../../value-objects';

/**
 * ScheduleTask Executed Event (Core Integration Event)
 *
 * Triggered when: A schedule task fires and is executed
 * Subscribers: Business modules (task, goal, reminder), Analytics
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskExecutedEvent {
  taskId: string;
  executionId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  identityId: string;
  status: ExecutionStatus;
  duration: number;
  payload: Record<string, unknown>;
}
