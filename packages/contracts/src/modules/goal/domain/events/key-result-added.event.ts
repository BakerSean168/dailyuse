/**
 * Key Result Added Event
 * 
 * Triggered when: Key result is added to goal
 * Subscribers: Goal statistics, User notifications
 */
export interface KeyResultAddedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Key result unique identifier */
  keyResultId: string;

  /** Addition timestamp */
  addedAt: number;
}
