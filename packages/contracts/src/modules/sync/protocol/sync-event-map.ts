import type {
  SyncStartedEvent,
  SyncProgressUpdatedEvent,
  SyncCompletedEvent,
  SyncFailedEvent,
  SyncConflictDetectedEvent,
  SyncConflictResolvedEvent,
  SyncDisconnectedEvent,
} from '../domain/events';

/**
 * Sync Module - Event Map
 * 
 * Event Naming Convention: sync:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type SyncEventMap = {
  'sync:start': SyncStartedEvent;

  'sync:progress': SyncProgressUpdatedEvent;

  'sync:complete': SyncCompletedEvent;

  'sync:fail': SyncFailedEvent;

  'sync:conflict-detect': SyncConflictDetectedEvent;

  'sync:conflict-resolve': SyncConflictResolvedEvent;

  'sync:disconnect': SyncDisconnectedEvent;
};
