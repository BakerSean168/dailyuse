/**
 * Sync Module - Domain Events
 * 
 * All domain event types for the Sync module
 */

export type { SyncStartedEvent } from './sync-started.event';
export type { SyncProgressUpdatedEvent } from './sync-progress-updated.event';
export type { SyncCompletedEvent } from './sync-completed.event';
export type { SyncFailedEvent } from './sync-failed.event';
export type { SyncConflictDetectedEvent } from './sync-conflict-detected.event';
export type { SyncConflictResolvedEvent } from './sync-conflict-resolved.event';
export type { SyncDisconnectedEvent } from './sync-disconnected.event';

// Re-export union type
export type { SyncStartedEvent as SyncDomainEvent } from './sync-started.event';
