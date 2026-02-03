/**
 * Reminder Template Created Event
 * 
 * Triggered when: New reminder template is created
 * Subscribers: User statistics, Reminder service
 */
export interface ReminderTemplateCreatedEvent {
  /** Reminder template unique identifier */
  templateId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Creation timestamp */
  createdAt: number;
}
