/**
 * Review Added Event
 * 
 * Triggered when: Goal review is added
 * Subscribers: User timeline, Goal audit log
 */
export interface ReviewAddedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Review unique identifier */
  reviewId: string;

  /** Addition timestamp */
  addedAt: number;
}
