import type { SyncCompletedEvent, SyncFailedEvent } from '../domain/events';

export type SyncEventMap = {
  'sync:SyncCompletedEvent': SyncCompletedEvent;
  'sync:SyncFailedEvent': SyncFailedEvent;
};
