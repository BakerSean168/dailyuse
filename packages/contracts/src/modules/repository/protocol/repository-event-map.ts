import type { RepositoryStatisticsUpdatedEvent } from '../domain/events';

export type RepositoryEventMap = {
  'repository:RepositoryStatisticsUpdatedEvent': RepositoryStatisticsUpdatedEvent;
};
