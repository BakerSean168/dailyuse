import type { RepositoryStatisticsUpdatedEvent } from '../domain/events/repository-statistics-updated.event';

/**
 * Repository Module - Event Map
 * 仓库模块 - 事件映射
 *
 * 事件命名规范：repository:{kebab-action-past-tense}
 */
export type RepositoryEventMap = {
  'repository:statistics-updated': RepositoryStatisticsUpdatedEvent;
};
