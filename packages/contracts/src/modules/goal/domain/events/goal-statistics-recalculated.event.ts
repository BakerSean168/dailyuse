/**
 * Goal Statistics Recalculated Event
 * 
 * Triggered when: User goal statistics need recalculation
 * Subscribers: Statistics cache, User dashboard
 */
export interface GoalStatisticsRecalculatedEvent {
  /** User/Identity identifier */
  identityId: string;

  /** Recalculation timestamp */
  recalculatedAt: number;
}
