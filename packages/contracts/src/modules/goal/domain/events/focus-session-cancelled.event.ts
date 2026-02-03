/**
 * Focus Session Cancelled Event
 * 
 * Triggered when: Focus session is cancelled
 * Subscribers: Session audit log
 * 
 * Note: aggregateId (sessionId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface FocusSessionCancelledEvent {}
