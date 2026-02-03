/**
 * Key Result Added Event
 * 
 * Triggered when: Key result is added to goal
 * Subscribers: Goal statistics, User notifications
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface KeyResultAddedEvent {
  /** Key result unique identifier */
  keyResultId: string;
}
