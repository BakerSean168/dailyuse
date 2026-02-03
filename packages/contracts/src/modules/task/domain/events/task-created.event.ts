/**
 * Task Created Event
 * 
 * Triggered when: Task instance is created from template
 * Subscribers: User statistics, Task tracking service
 */
export interface TaskCreatedEvent {
  /** Task instance unique identifier */
  taskId: string;

  /** Task template identifier */
  templateId: string;

  /** Associated goal identifier (if any) */
  goalId: string | null;

  /** Creation timestamp */
  createdAt: number;
}
