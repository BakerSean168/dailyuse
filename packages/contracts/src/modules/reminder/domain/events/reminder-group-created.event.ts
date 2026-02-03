/**
 * Reminder Group Created Event
 * 
 * Triggered when: Reminder group is created
 * Subscribers: Reminder categorization service
 */
export interface ReminderGroupCreatedEvent {
  /** Reminder group unique identifier */
  groupId: string;

  /** Associated template identifier */
  templateId: string;

  /** Creation timestamp */
  createdAt: number;
}
