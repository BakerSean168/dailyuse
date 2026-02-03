/**
 * Task Uncompleted Event
 * 
 * Triggered when: Completed task is marked as incomplete again
 * Subscribers: User statistics, Goal progress recalculation
 */
export interface TaskUncompletedEvent {
  /** Task instance unique identifier */
  taskId: string;

  /** Timestamp when task is marked incomplete */
  uncompletedAt: number;
}
