import { describe, expect, it, vi } from 'vitest';
import { AggregateRoot } from '@dailyuse/utils/domain';
import type { IEventBus } from '../events';
import { publishAggregateEvents } from './aggregate-repository.base';

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }

  emit(payload: { value: string }) {
    this.addDomainEvent('test:aggregate-event', payload);
  }
}

describe('publishAggregateEvents', () => {
  it('publishes accumulated events and clears the buffer', async () => {
    const aggregate = new TestAggregate('agg-1');
    const eventBus: IEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    aggregate.emit({ value: 'first' });
    aggregate.emit({ value: 'second' });

    await publishAggregateEvents(aggregate, eventBus);

    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    expect(eventBus.publish).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        eventType: 'test:aggregate-event',
        payload: { value: 'first' },
        aggregateId: 'agg-1',
      }),
    );
    expect(eventBus.publish).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        eventType: 'test:aggregate-event',
        payload: { value: 'second' },
        aggregateId: 'agg-1',
      }),
    );
    expect(aggregate.domainEvents).toHaveLength(0);
  });

  it('does nothing when the aggregate has no pending events', async () => {
    const aggregate = new TestAggregate('agg-2');
    const eventBus: IEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    await publishAggregateEvents(aggregate, eventBus);

    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(aggregate.domainEvents).toHaveLength(0);
  });
});
