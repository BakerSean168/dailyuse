/**
 * Sync Progress Updated Event
 * 
 * Triggered when: Sync progresses
 * Subscribers: Sync status tracking, UI progress updates
 */
export interface SyncProgressUpdatedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** Number of items processed */
  processedCount: number;

  /** Total items to process */
  totalCount: number;

  /** Update timestamp */
  updatedAt: number;
}
