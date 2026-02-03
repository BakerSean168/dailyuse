/**
 * Goal Deleted Event
 * 
 * Triggered when: Goal is deleted
 * Subscribers: Cleanup services, Audit log, Goal folder stats
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalDeletedEvent {
  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
