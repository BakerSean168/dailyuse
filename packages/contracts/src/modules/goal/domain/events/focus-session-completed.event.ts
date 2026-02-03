/**
 * Focus Session Completed Event
 * 
 * Triggered when: Focus session completes successfully
 * Subscribers: User statistics, Achievement system
 * 
 * Note: aggregateId (sessionId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface FocusSessionCompletedEvent {
  /** Total session duration in milliseconds */
  duration: number;
}
