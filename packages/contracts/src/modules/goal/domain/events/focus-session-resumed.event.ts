/**
 * Focus Session Resumed Event
 * 
 * Triggered when: Focus session resumes after pause
 * Subscribers: Session tracking
 */
export interface FocusSessionResumedEvent {
  /** Session unique identifier */
  sessionId: string;

  /** Resume timestamp */
  resumedAt: number;
}
