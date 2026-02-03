/**
 * Goal Status Changed Event
 * 
 * Triggered when: Goal status transitions (Draft → Active → Completed, etc.)
 * Subscribers: Goal folder stats, User notifications, Goal timeline
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalStatusChangedEvent {
  /** Previous goal status */
  previousStatus: string;

  /** New goal status */
  newStatus: string;
}
