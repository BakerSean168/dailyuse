/**
 * Reminder Template Updated Event
 * 
 * Triggered when: Reminder template properties are updated
 * Subscribers: Reminder service, Cache invalidation
 */
export interface ReminderTemplateUpdatedEvent {
  /** Reminder template unique identifier */
  templateId: string;

  /** List of fields that were changed */
  changes: string[];

  /** Update timestamp */
  updatedAt: number;
}
