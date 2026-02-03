/**
 * Goal Completed Event
 * 
 * Triggered when: Goal is completed
 * Subscribers: User statistics, Achievement system, Goal folder stats
 */
export interface GoalCompletedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Completion timestamp */
  completedAt: number;

  /** Final progress percentage */
  finalProgress: number;
}
