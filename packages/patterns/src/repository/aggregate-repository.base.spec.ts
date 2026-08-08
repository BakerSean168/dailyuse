import { describe, expect, it, vi } from 'vitest';
import { AggregateRoot } from '@memoflow/utils/domain';
import type { IEventBus } from '../events';
import type { IOutboxWriter } from '../outbox';
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

    await publishAggregateEvents(aggregate, { eventBus });

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

    await publishAggregateEvents(aggregate, { eventBus });

    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(aggregate.domainEvents).toHaveLength(0);
  });

  it('persists failed events to the outbox instead of losing them (R1-2)', async () => {
    const aggregate = new TestAggregate('agg-3');
    const eventBus: IEventBus = {
      publish: vi.fn().mockRejectedValue(new Error('bus down')),
    };
    const outboxWriter: IOutboxWriter = {
      enqueue: vi.fn().mockResolvedValue('msg-1' as never),
    };

    aggregate.emit({ value: 'first' });
    aggregate.emit({ value: 'second' });

    await publishAggregateEvents(aggregate, {
      eventBus,
      outboxWriter,
      correlationId: 'corr-1' as never,
      causationId: null,
      identityId: 'user-1',
    });

    // 每个失败事件都落入 outbox，且不会抛出。
    expect(outboxWriter.enqueue).toHaveBeenCalledTimes(2);
    expect(outboxWriter.enqueue).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        messageType: 'test:aggregate-event',
        payloadJson: JSON.stringify({ value: 'first' }),
        correlationId: 'corr-1',
        causationId: null,
        identityId: 'user-1',
      }),
    );
    // buffer 仍被清空（事件已持久化到 outbox，可重试投递）。
    expect(aggregate.domainEvents).toHaveLength(0);
  });

  it('keeps the legacy no-outbox behavior when none is provided', async () => {
    const aggregate = new TestAggregate('agg-4');
    const eventBus: IEventBus = {
      publish: vi.fn().mockRejectedValue(new Error('bus down')),
    };

    aggregate.emit({ value: 'first' });

    await publishAggregateEvents(aggregate, { eventBus });

    // 无 outbox 时：只记日志不抛出，buffer 清空（向后兼容）。
    expect(aggregate.domainEvents).toHaveLength(0);
  });
});
