import type { RepositoryCreatedEvent } from '../domain/events/repository-created.event';
import type { RepositoryUpdatedEvent } from '../domain/events/repository-updated.event';
import type { RepositoryArchivedEvent } from '../domain/events/repository-archived.event';
import type { RepositoryDeletedEvent } from '../domain/events/repository-deleted.event';
import type { RepositoryStatisticsUpdatedEvent } from '../domain/events/repository-statistics-updated.event';
import type { RepositoryResourceMutatedEvent } from '../domain/events';

/**
 * Repository Module - Event Map
 * 仓库模块 - 事件映射
 *
 * 事件命名规范：repository:{kebab-action-past-tense}
 */
export type RepositoryEventMap = {
  'repository:created': RepositoryCreatedEvent;
  'repository:updated': RepositoryUpdatedEvent;
  'repository:archived': RepositoryArchivedEvent;
  'repository:deleted': RepositoryDeletedEvent;
  'repository:statistics-updated': RepositoryStatisticsUpdatedEvent;
  'repository:resource:mutated': RepositoryResourceMutatedEvent;
};
