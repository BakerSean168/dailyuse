/**
 * Goal Archived Event
 * 
 * Triggered when: Goal is archived
 * Subscribers: Goal folder stats, User statistics
 */
export interface GoalArchivedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Archive timestamp */
  archivedAt: number;
}
