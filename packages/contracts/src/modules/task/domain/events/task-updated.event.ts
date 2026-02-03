/**
 * Task Updated Event
 * 
 * Triggered when: Task properties are modified
 * Subscribers: Task tracking, User activity log
 */
export interface TaskUpdatedEvent {
  /** Task instance unique identifier */
  taskId: string;

  /** List of fields that were changed */
  changes: string[];

  /** Update timestamp */
  updatedAt: number;
}
