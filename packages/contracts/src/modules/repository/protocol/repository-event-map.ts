import type { RepositoryStatisticsUpdatedEvent } from '../domain/events/repository-statistics-updated.event';

export type RepositoryEventMap = {
  'repository:RepositoryStatisticsUpdatedEvent': RepositoryStatisticsUpdatedEvent;
};
