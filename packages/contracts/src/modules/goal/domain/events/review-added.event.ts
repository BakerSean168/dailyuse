/**
 * Review Added Event
 * 
 * Triggered when: Goal review is added
 * Subscribers: User timeline, Goal audit log
 * 
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ReviewAddedEvent {
  /** Review unique identifier */
  reviewId: string;
}
