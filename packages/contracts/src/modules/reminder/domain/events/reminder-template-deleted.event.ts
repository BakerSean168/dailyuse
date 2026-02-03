/**
 * Reminder Template Deleted Event
 * 
 * Triggered when: Reminder template is deleted
 * Subscribers: Cleanup services, Audit log
 */
export interface ReminderTemplateDeletedEvent {
  /** Reminder template unique identifier */
  templateId: string;

  /** Deletion timestamp */
  deletedAt: number;

  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
