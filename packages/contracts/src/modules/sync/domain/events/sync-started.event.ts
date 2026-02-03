/**
 * Sync Started Event
 * 
 * Triggered when: Sync session begins
 * Subscribers: Sync tracking service
 */
export interface SyncStartedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Start timestamp */
  startedAt: number;
}
