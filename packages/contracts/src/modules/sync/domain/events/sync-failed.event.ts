/**
 * Sync Failed Event
 * 
 * Triggered when: Sync session fails
 * Subscribers: Error handlers, Retry service
 */
export interface SyncFailedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** Error reason */
  reason: string;

  /** Failure timestamp */
  failedAt: number;
}
