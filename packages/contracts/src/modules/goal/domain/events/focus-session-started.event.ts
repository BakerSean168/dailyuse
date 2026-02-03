/**
 * Focus Session Started Event
 * 
 * Triggered when: Focus session begins
 * Subscribers: Session tracking, User activity log
 * 
 * Note: aggregateId (sessionId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface FocusSessionStartedEvent {
  /** Associated goal identifier */
  goalId: string;
}
