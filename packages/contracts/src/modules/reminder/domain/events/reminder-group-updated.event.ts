/**
 * Reminder Group Updated Event
 * 
 * Triggered when: Reminder group properties are updated
 * Subscribers: Reminder grouping service
 */
export interface ReminderGroupUpdatedEvent {
  /** Reminder group unique identifier */
  groupId: string;

  /** List of fields that were changed */
  changes: string[];

  /** Update timestamp */
  updatedAt: number;
}
