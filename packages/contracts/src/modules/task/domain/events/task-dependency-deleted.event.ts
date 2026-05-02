/**
 * Task Dependency Deleted Event
 *
 * Triggered when a dependency relationship between two tasks is removed.
 */
export interface TaskDependencyDeletedEvent {
  dependencyId: string;
  predecessorTaskId: string;
  successorTaskId: string;
}
