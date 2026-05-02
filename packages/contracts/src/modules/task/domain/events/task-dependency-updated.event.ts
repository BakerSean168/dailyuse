/**
 * Task Dependency Updated Event
 *
 * Triggered when an existing task dependency is modified.
 */
export interface TaskDependencyUpdatedEvent {
  dependencyId: string;
  changedFields: string[];
}
