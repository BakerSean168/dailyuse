/**
 * Goal Completed Event
 * 
 * Triggered when: Goal is completed
 * Subscribers: User statistics, Achievement system, Goal folder stats
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalCompletedEvent {
  /** Final progress percentage */
  finalProgress: number;
}
