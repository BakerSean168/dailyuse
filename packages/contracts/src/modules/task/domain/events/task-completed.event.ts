/**
 * Task Completed Event
 * 
 * Triggered when: Task is marked as completed
 * Subscribers: User statistics, Achievement system, Goal progress
 */
export interface TaskCompletedEvent {
  /** Task instance unique identifier */
  taskId: string;

  /** Completion timestamp */
  completedAt: number;

  /** Associated goal identifier (if any) */
  goalId: string | null;
}
