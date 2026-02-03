/**
 * Task Deleted Event
 * 
 * Triggered when: Task is deleted
 * Subscribers: Cleanup services, Task statistics
 */
export interface TaskDeletedEvent {
  /** Task instance unique identifier */
  taskId: string;

  /** Deletion timestamp */
  deletedAt: number;

  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
