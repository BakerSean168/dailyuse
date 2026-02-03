/**
 * Focus Session Paused Event
 * 
 * Triggered when: Focus session is paused
 * Subscribers: Session tracking
 */
export interface FocusSessionPausedEvent {
  /** Session unique identifier */
  sessionId: string;

  /** Pause timestamp */
  pausedAt: number;
}
