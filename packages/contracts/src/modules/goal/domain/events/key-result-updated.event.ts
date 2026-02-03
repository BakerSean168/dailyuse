/**
 * Key Result Updated Event
 * 
 * Triggered when: Key result progress is updated
 * Subscribers: Goal progress calculator, User notifications
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface KeyResultUpdatedEvent {
  /** Key result unique identifier */
  keyResultId: string;

  /** Previous progress value */
  previousValue: number;

  /** New progress value */
  newValue: number;
}
