import type { RepositoryResourceMutatedEvent } from '../domain/events';

/**
 * Repository Module - Event Map
 *
 * Only the knowledge resource mutation event remains on the shared bus.
 * Legacy repository aggregate lifecycle events were removed with database CRUD.
 */
export type RepositoryEventMap = {
  'repository:resource:mutated': RepositoryResourceMutatedEvent;
};
