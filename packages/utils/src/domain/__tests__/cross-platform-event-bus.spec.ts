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
});
