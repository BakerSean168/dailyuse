import { describe, expect, it, vi } from 'vitest';
import { CrossPlatformEventBus } from '../cross-platform-event-bus';

type TestEvents = {
  'test:event': { value: string };
};

describe('CrossPlatformEventBus', () => {
  it('isolates synchronous subscriber failures', () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const succeedingHandler = vi.fn();

    eventBus.on('test:event', () => {
      throw new Error('sync failure');
    });
    eventBus.on('test:event', succeedingHandler);

    expect(() => eventBus.send('test:event', { value: 'payload' })).not.toThrow();
    expect(succeedingHandler).toHaveBeenCalledWith({ value: 'payload' });
  });

  it('handles rejected subscriber promises without blocking later subscribers', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const succeedingHandler = vi.fn();

    eventBus.on('test:event', async () => {
      throw new Error('async failure');
    });
    eventBus.on('test:event', succeedingHandler);

    eventBus.send('test:event', { value: 'payload' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(succeedingHandler).toHaveBeenCalledWith({ value: 'payload' });
  });

  it('awaitDrain throws the first synchronous handler error for the reliable seam', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    eventBus.on('test:event', () => {
      throw new Error('sync failure');
    });

    // send() itself stays isolated (H3): no synchronous throw.
    eventBus.send('test:event', { value: 'payload' });
    // awaitDrain() surfaces the failure to the reliable publisher.
    await expect(eventBus.awaitDrain()).rejects.toThrow('sync failure');
  });

  it('awaitDrain throws the first asynchronous handler rejection', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    eventBus.on('test:event', async () => {
      throw new Error('async failure');
    });

    eventBus.send('test:event', { value: 'payload' });
    await expect(eventBus.awaitDrain()).rejects.toThrow('async failure');
  });

  it('awaitDrain resolves when all handlers succeed and does not leak sync errors across sends', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const failing = vi.fn(() => {
      throw new Error('transient sync failure');
    });
    const succeeding = vi.fn(async () => 'ok');

    eventBus.on('test:event', failing);
    // A fire-and-forget notification send triggers a sync failure that is never drained.
    eventBus.send('test:event', { value: 'payload' });
    eventBus.off('test:event', failing);

    eventBus.on('test:event', succeeding);
    eventBus.send('test:event', { value: 'payload' });
    // The stale sync failure from the previous (un-drained) send must not surface here.
    await expect(eventBus.awaitDrain()).resolves.toBeUndefined();
    expect(succeeding).toHaveBeenCalled();
  });

  it('awaitDrain waits for concurrent async handlers before resolving', async () => {
    const eventBus = new CrossPlatformEventBus<TestEvents>();
    const order: string[] = [];
    eventBus.on('test:event', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('handler');
    });

    eventBus.send('test:event', { value: 'payload' });
    order.push('after-send');
    await eventBus.awaitDrain();
    order.push('after-drain');
    expect(order).toEqual(['after-send', 'handler', 'after-drain']);
  });
});
