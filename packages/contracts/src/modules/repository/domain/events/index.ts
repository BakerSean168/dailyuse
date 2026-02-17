export interface RepositoryStatisticsUpdatedEvent {
  aggregateId: string;
  timestamp: number;
  identityId: string;
  totalRepositories: number;
  totalResources: number;
}
