/**
 * Reminder Group Deleted Event
 * 
 * Triggered when: Reminder group is deleted
 * Subscribers: Cleanup services
 */
export interface ReminderGroupDeletedEvent {
  /** Reminder group unique identifier */
  groupId: string;

  /** Deletion timestamp */
  deletedAt: number;
}
