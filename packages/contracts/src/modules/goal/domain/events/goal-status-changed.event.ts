/**
 * Goal Status Changed Event
 * 
 * Triggered when: Goal status transitions (Draft → Active → Completed, etc.)
 * Subscribers: Goal folder stats, User notifications, Goal timeline
 */
export interface GoalStatusChangedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Previous goal status */
  previousStatus: string;

  /** New goal status */
  newStatus: string;

  /** Status change timestamp */
  changedAt: number;
}
