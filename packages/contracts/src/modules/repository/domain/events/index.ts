import type { IdentityId, RepositoryId, ResourceId } from '../../../../primitives';

/**
 * Fired when knowledge runtime creates/updates/deletes a note projection or
 * confirmed write. AI auto-index and other subscribers listen for this only.
 */
export const REPOSITORY_RESOURCE_MUTATED_EVENT = 'repository:resource:mutated' as const;

export const RepositoryResourceMutationType = {
  Created: 'created',
  ContentUpdated: 'content_updated',
  Moved: 'moved',
  Deleted: 'deleted',
} as const;

export type RepositoryResourceMutationType =
  (typeof RepositoryResourceMutationType)[keyof typeof RepositoryResourceMutationType];

export interface RepositoryResourceMutatedEvent {
  identityId: IdentityId;
  repositoryId: RepositoryId;
  resourceId: ResourceId;
  resourcePath: string;
  mutation: RepositoryResourceMutationType;
  timestamp: number;
}
