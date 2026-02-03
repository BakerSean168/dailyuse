/**
 * Sync Conflict Detected Event
 * 
 * Triggered when: Conflicting changes are detected during sync
 * Subscribers: Conflict resolution service
 */
export interface SyncConflictDetectedEvent {
  /** Sync session unique identifier */
  sessionId: string;

  /** Conflicting entity identifier */
  entityId: string;

  /** Detection timestamp */
  detectedAt: number;
}
