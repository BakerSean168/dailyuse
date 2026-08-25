import { describe, expect, it, vi } from 'vitest';
import { CrossPlatformEventBus } from '../cross-platform-event-bus';

type TestEvents = {
  'test:event': { value: string };
};

const nextMacrotask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('CrossPlatformEventBus', () => {
  it('keeps send fire-and-forget while isolating synchronous subscriber failures', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const succeedingHandler = vi.fn();

    eventBus.on('test:event', () => {
      throw new Error('sync failure');
    });
    eventBus.on('test:event', succeedingHandler);

    expect(() => eventBus.send('test:event', { value: 'payload' })).not.toThrow();
    await nextMacrotask();

    expect(succeedingHandler).toHaveBeenCalledWith({ value: 'payload' }, undefined);
  });

  it('keeps send fire-and-forget while isolating rejected subscriber promises', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const succeedingHandler = vi.fn();

    eventBus.on('test:event', async () => {
      throw new Error('async failure');
    });
    eventBus.on('test:event', succeedingHandler);

    eventBus.send('test:event', { value: 'payload' });
    await nextMacrotask();

    expect(succeedingHandler).toHaveBeenCalledWith({ value: 'payload' }, undefined);
  });

  it('dispatch surfaces synchronous handler failure only for that delivery', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    eventBus.on('test:event', ({ value }) => {
      if (value === 'fail') throw new Error('sync failure');
    });

    const failure = eventBus.dispatch('test:event', { value: 'fail' });
    const success = eventBus.dispatch('test:event', { value: 'ok' });

    await expect(success).resolves.toBeUndefined();
    await expect(failure).rejects.toThrow('sync failure');
  });

  it('dispatch surfaces asynchronous handler rejection', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    eventBus.on('test:event', async () => {
      throw new Error('async failure');
    });

    await expect(eventBus.dispatch('test:event', { value: 'payload' })).rejects.toThrow(
      'async failure',
    );
  });

  it('dispatch aggregates multiple independent subscriber failures', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    eventBus.on('test:event', () => {
      throw new Error('first failure');
    });
    eventBus.on('test:event', async () => {
      throw new Error('second failure');
    });

    await expect(eventBus.dispatch('test:event', { value: 'payload' })).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ message: 'first failure' }),
        expect.objectContaining({ message: 'second failure' }),
      ],
    });
  });

  it('dispatch waits for all concurrent handlers before resolving', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const order: string[] = [];

    eventBus.on('test:event', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('slow');
    });
    eventBus.on('test:event', async () => {
      order.push('fast');
    });

    const delivery = eventBus.dispatch('test:event', { value: 'payload' });
    order.push('after-dispatch');
    await delivery;
    order.push('after-await');

    expect(order).toEqual(['after-dispatch', 'fast', 'slow', 'after-await']);
  });

  it('does not let a blocked delivery delay an independent concurrent delivery', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    eventBus.on('test:event', async ({ value }) => {
      if (value === 'first') await firstGate;
    });

    const first = eventBus.dispatch('test:event', { value: 'first' });
    const second = eventBus.dispatch('test:event', { value: 'second' });

    await expect(second).resolves.toBeUndefined();
    releaseFirst();
    await expect(first).resolves.toBeUndefined();
  });

  it('delivers metadata without leaking the Emittery envelope to subscribers', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const handler = vi.fn();
    const occurredAt = new Date('2026-08-25T00:00:00.000Z');

    eventBus.on('test:event', handler);
    await eventBus.dispatch(
      'test:event',
      { value: 'payload' },
      { aggregateId: 'agg-1', occurredAt, idempotencyKey: 'idem-1' },
    );

    expect(handler).toHaveBeenCalledWith(
      { value: 'payload' },
      { aggregateId: 'agg-1', occurredAt, idempotencyKey: 'idem-1' },
    );
  });

  it('supports explicit unsubscribe and destroy cleanup', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const first = vi.fn();
    const second = vi.fn();

    eventBus.on('test:event', first);
    eventBus.on('test:event', second);
    expect(eventBus.getStats()).toEqual({ listenersCount: 1 });

    eventBus.off('test:event', first);
    await eventBus.dispatch('test:event', { value: 'after-off' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    eventBus.destroy();
    expect(eventBus.getStats()).toEqual({ listenersCount: 0 });
    await eventBus.dispatch('test:event', { value: 'after-destroy' });
    expect(second).toHaveBeenCalledTimes(1);
  });
});
