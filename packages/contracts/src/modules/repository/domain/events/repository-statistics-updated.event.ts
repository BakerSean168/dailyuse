import type { IdentityId } from '../../../../primitives';

export interface RepositoryStatisticsUpdatedEvent {
  identityId: IdentityId;
  totalRepositories: number;
  totalResources: number;
}
