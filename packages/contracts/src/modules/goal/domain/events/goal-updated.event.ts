/**
 * Goal Updated Event
 * 
 * Triggered when: Goal properties are updated
 * Subscribers: Goal folder stats, User activity log
 */
export interface GoalUpdatedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** List of fields that were changed */
  changes: string[];

  /** Update timestamp */
  updatedAt: number;
}
