/**
 * Goal Updated Event
 * 
 * Triggered when: Goal properties are updated
 * Subscribers: Goal folder stats, User activity log
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalUpdatedEvent {
  /** List of fields that were changed */
  changes: string[];
}
