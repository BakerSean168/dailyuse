/**
 * Task Dependency Created Event
 *
 * Triggered when a dependency relationship is established between two tasks.
 */
export interface TaskDependencyCreatedEvent {
  identityId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: string;
}
