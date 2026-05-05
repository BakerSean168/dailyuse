/**
 * Task Dependency Created Event
 *
 * Triggered when a dependency relationship is established between two tasks.
 */
import type { IdentityId, TaskTemplateId } from '../../../../primitives';

export interface TaskDependencyCreatedEvent {
  identityId: IdentityId;
  predecessorTaskId: TaskTemplateId;
  successorTaskId: TaskTemplateId;
  dependencyType: string;
}
