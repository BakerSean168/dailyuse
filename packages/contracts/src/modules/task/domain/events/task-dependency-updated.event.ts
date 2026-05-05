/**
 * Task Dependency Updated Event
 *
 * Triggered when an existing task dependency is modified.
 */
import type { TaskDependencyId } from '../../../../primitives';

export interface TaskDependencyUpdatedEvent {
  dependencyId: TaskDependencyId;
  changedFields: string[];
}
