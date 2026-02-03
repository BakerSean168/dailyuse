/**
 * Goal Deleted Event
 * 
 * Triggered when: Goal is deleted
 * Subscribers: Cleanup services, Audit log, Goal folder stats
 */
export interface GoalDeletedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Deletion timestamp */
  deletedAt: number;

  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
