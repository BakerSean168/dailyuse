import type { ScheduleTaskId, ScheduleExecutionId, IdentityId } from '../../../../primitives';
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
  taskId: ScheduleTaskId;
  executionId: ScheduleExecutionId;
  sourceModule: SourceModule;
  sourceEntityId: string;
  identityId: IdentityId;
  status: ExecutionStatus;
  duration: number;
  payload: Record<string, unknown>;
}
