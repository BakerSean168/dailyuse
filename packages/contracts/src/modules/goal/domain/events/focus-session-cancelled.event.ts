/**
 * Focus Session Cancelled Event
 * 
 * Triggered when: Focus session is cancelled
 * Subscribers: Session audit log
 */
export interface FocusSessionCancelledEvent {
  /** Session unique identifier */
  sessionId: string;

  /** Cancellation timestamp */
  cancelledAt: number;
}
