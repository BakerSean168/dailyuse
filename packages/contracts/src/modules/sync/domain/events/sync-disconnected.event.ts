/**
 * Sync Disconnected Event
 * 
 * Triggered when: Sync connection is lost
 * Subscribers: Offline mode handlers, UI notification
 */
export interface SyncDisconnectedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** Disconnection timestamp */
  disconnectedAt: number;
}
