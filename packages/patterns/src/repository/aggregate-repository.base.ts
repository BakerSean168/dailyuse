/**
 * AggregateRepository Base Class
 *
 * Provides automatic domain event publishing after persistence.
 * All aggregate root repositories should extend this base class.
 *
 * Template Method pattern:
 * - save() defines algorithm skeleton: persist first, then publish events
 * - persist() is implemented by subclasses
 * - publishAggregateEvents() publishes and clears the aggregate event buffer
 *
 * Event handling:
 * - AggregateRoot.domainEvents provides the event list
 * - AggregateRoot.clearDomainEvents() clears published events
 */

import type { AggregateRoot } from '@memoflow/utils/domain';
import type { Equatable } from '@memoflow/contracts/shared';
import type { IEventBus } from '../events';
import { createLogger } from '@memoflow/utils/logger';

const logger = createLogger('AggregateRepository');

export interface IAggregateRepository<T extends AggregateRoot<string | number | Equatable>> {
  save(aggregate: T): Promise<void>;
}

/**
 * Publish and clear domain events accumulated on an aggregate.
 *
 * Reused by both save() (via AggregateRepositoryBase) and
 * deleteAggregate() (on concrete repositories).
 * Event publish failures are logged but do not interrupt the flow.
 */
export async function publishAggregateEvents(
  aggregate: AggregateRoot<string | number | Equatable>,
  eventBus: IEventBus,
): Promise<void> {
  const events = aggregate.domainEvents;

  if (events.length === 0) {
    return;
  }

  for (const event of events) {
    try {
      await eventBus.publish(event);

      logger.debug('[AggregateRepository] Event published', {
        eventType: event.eventType,
        aggregateId: aggregate.id,
      });
    } catch (error) {
      logger.error('[AggregateRepository] Failed to publish event', {
        eventType: event.eventType,
        aggregateId: aggregate.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  aggregate.clearDomainEvents();
}

/**
 * Aggregate root repository base class
 *
 * Responsibilities:
 * 1. Auto-publish domain events after successful persistence
 * 2. Handle event publish failures gracefully
 * 3. Provide a unified error handling pattern
 */
export abstract class AggregateRepositoryBase<T extends AggregateRoot<string | number | Equatable>>
  implements IAggregateRepository<T>
{
  constructor(protected readonly eventBus: IEventBus) {}

  /**
   * Save aggregate root (template method)
   *
   * Flow:
   * 1. Call subclass persist() to persist data
   * 2. On success, publish domain events
   * 3. Clear published events
   */
  async save(aggregate: T): Promise<void> {
    try {
      await this.persist(aggregate);
      await publishAggregateEvents(aggregate, this.eventBus);

      logger.debug('[AggregateRepository] Aggregate saved and events published', {
        aggregateId: aggregate.id,
        eventCount: aggregate.domainEvents.length,
      });
    } catch (error) {
      logger.error('[AggregateRepository] Failed to save aggregate', {
        aggregateId: aggregate.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Persist aggregate root (implemented by subclass)
   *
   * Subclasses implement concrete persistence logic here.
   * No need to handle event publishing — the base class handles it.
   */
  protected abstract persist(aggregate: T): Promise<void>;
}
