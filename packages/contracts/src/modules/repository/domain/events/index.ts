export { type RepositoryCreatedEvent } from './repository-created.event';
export { type RepositoryUpdatedEvent } from './repository-updated.event';
export { type RepositoryArchivedEvent } from './repository-archived.event';
export { type RepositoryDeletedEvent } from './repository-deleted.event';
export { type RepositoryStatisticsUpdatedEvent } from './repository-statistics-updated.event';

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
  identityId: string;
  repositoryId: string;
  resourceId: string;
  resourcePath: string;
  mutation: RepositoryResourceMutationType;
  timestamp: number;
}
