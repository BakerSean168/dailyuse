/**
 * Focus Session Completed Event
 * 
 * Triggered when: Focus session completes successfully
 * Subscribers: User statistics, Achievement system
 */
export interface FocusSessionCompletedEvent {
  /** Session unique identifier */
  sessionId: string;

  /** Completion timestamp */
  completedAt: number;

  /** Total session duration in milliseconds */
  duration: number;
}
