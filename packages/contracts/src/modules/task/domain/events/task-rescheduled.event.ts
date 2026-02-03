/**
 * Task Rescheduled Event
 * 
 * Triggered when: Task due date is changed
 * Subscribers: Task scheduler, User notifications
 */
export interface TaskRescheduledEvent {
  /** Task instance unique identifier */
  taskId: string;

  /** Previous due date */
  previousDueDate: number;

  /** New due date */
  newDueDate: number;

  /** Reschedule timestamp */
  rescheduledAt: number;
}
