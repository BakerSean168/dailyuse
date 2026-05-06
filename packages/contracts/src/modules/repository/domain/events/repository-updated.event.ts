import type { RepositoryId } from '../../../../primitives';

export interface RepositoryUpdatedEvent {
  repositoryId: RepositoryId;
  changedFields: string[];
}
