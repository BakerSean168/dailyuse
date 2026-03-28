export interface RepositoryStatisticsUpdatedEvent {
  aggregateId: string;
  timestamp: number;
  identityId: string;
  totalRepositories: number;
  totalResources: number;
}

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
