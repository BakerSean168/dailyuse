import type { IDomainEvent } from '@memoflow/contracts/shared';
import { createEventBusAdapter, type IEventBus } from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';

const logger = createLogger('TaskWriteBufferedEventBus');

export const committedTaskWriteEventBus = createEventBusAdapter(eventBus);

export class BufferedTaskWriteEventBus implements IEventBus {
  private readonly events: IDomainEvent[] = [];

  async publish<T extends IDomainEvent>(event: T): Promise<void> {
    this.events.push(event);
  }

  async flush(target: IEventBus): Promise<void> {
    for (const event of this.events) {
      try {
        await target.publish(event);
      } catch (error) {
        logger.error('Failed to publish buffered domain event', {
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          error,
        });
      }
    }

    this.events.length = 0;
  }
}
