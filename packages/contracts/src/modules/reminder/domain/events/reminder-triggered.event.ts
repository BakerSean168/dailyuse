/**
 * Reminder Triggered Event
 * 
 * Triggered when: Reminder is sent to user
 * Subscribers: User notification service, Reminder statistics
 */
export interface ReminderTriggeredEvent {
  /** Reminder template unique identifier */
  templateId: string;

  /** Reminder group unique identifier */
  groupId: string;

  /** Trigger timestamp */
  triggeredAt: number;
}
