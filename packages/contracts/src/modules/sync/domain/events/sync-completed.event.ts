/**
 * Sync Completed Event
 * 
 * Triggered when: Sync session completes successfully
 * Subscribers: Sync completion handlers
 */
export interface SyncCompletedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** Completion timestamp */
  completedAt: number;

  /** Total items synced */
  totalSynced: number;
}
