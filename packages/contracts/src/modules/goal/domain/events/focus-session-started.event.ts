/**
 * Focus Session Started Event
 * 
 * Triggered when: Focus session begins
 * Subscribers: Session tracking, User activity log
 */
export interface FocusSessionStartedEvent {
  /** Session unique identifier */
  sessionId: string;

  /** Associated goal identifier */
  goalId: string;

  /** Session start timestamp */
  startedAt: number;
}
