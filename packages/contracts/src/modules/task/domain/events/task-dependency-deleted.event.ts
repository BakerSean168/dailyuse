/**
 * Task Dependency Deleted Event
 *
 * Triggered when a dependency relationship between two tasks is removed.
 */
import type { TaskDependencyId, TaskTemplateId } from '../../../../primitives';

export interface TaskDependencyDeletedEvent {
  dependencyId: TaskDependencyId;
  predecessorTaskId: TaskTemplateId;
  successorTaskId: TaskTemplateId;
}
