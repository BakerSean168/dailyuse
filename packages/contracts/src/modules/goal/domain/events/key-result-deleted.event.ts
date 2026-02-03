/**
 * Key Result Deleted Event
 * 
 * Triggered when: Key result is deleted
 * Subscribers: Goal statistics cleanup
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface KeyResultDeletedEvent {
  /** Key result unique identifier */
  keyResultId: string;
}
