/**
 * Key Result Deleted Event
 * 
 * Triggered when: Key result is deleted
 * Subscribers: Goal statistics cleanup
 */
export interface KeyResultDeletedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Key result unique identifier */
  keyResultId: string;

  /** Deletion timestamp */
  deletedAt: number;
}
