/**
 * Sync Conflict Resolved Event
 * 
 * Triggered when: Sync conflict is resolved
 * Subscribers: Sync completion handlers
 */
export interface SyncConflictResolvedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** Conflicting entity identifier */
  entityId: string;

  /** Resolution method (server-wins, client-wins, merge, etc) */
  resolution: string;

  /** Resolution timestamp */
  resolvedAt: number;
}
