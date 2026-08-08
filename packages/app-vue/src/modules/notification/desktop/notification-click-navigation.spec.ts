import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { RendererEventChannels } from '@memoflow/contracts/electron';
import { createNotificationClickNavigation } from './notification-click-navigation';

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: {} as never },
      { path: '/goals', component: {} as never },
      { path: '/goals/:id', component: {} as never },
      { path: '/notifications', component: {} as never },
    ],
  });
}

function makeBridge() {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  return {
    invoke: vi.fn(async () => undefined),
    on: vi.fn((channel: string, cb: (...args: unknown[]) => void) => {
      handlers.set(channel, [...(handlers.get(channel) ?? []), cb]);
    }),
    off: vi.fn((channel: string, cb: (...args: unknown[]) => void) => {
      handlers.set(channel, (handlers.get(channel) ?? []).filter((h) => h !== cb));
    }),
    emit: (channel: string, ...args: unknown[]) => {
      for (const h of handlers.get(channel) ?? []) h(...args);
    },
  };
}

describe('createNotificationClickNavigation (R3 收尾)', () => {
  it('navigates via navigationIntent when present', async () => {
    const router = makeRouter();
    const bridge = makeBridge() as ReturnType<typeof makeBridge> & { emit(ch: string, ...a: unknown[]): void };
    const nav = createNotificationClickNavigation(router, () => bridge as never);
    nav.start();

    bridge.emit(RendererEventChannels.NOTIFICATION_CLICKED, {
      notificationId: 'n-1',
      navigationIntent: { route: '/goals/g-1', params: { id: 'g-1' } },
    });

    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/goals/g-1');
  });

  it('falls back to category landing route', async () => {
    const router = makeRouter();
    const bridge = makeBridge() as ReturnType<typeof makeBridge> & { emit(ch: string, ...a: unknown[]): void };
    const nav = createNotificationClickNavigation(router, () => bridge as never);
    nav.start();

    bridge.emit(RendererEventChannels.NOTIFICATION_CLICKED, {
      notificationId: 'n-2',
      notificationCategory: 'Reminder',
    });

    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/reminders');
  });

  it('falls back to /notifications for unknown categories', async () => {
    const router = makeRouter();
    const bridge = makeBridge() as ReturnType<typeof makeBridge> & { emit(ch: string, ...a: unknown[]): void };
    const nav = createNotificationClickNavigation(router, () => bridge as never);
    nav.start();

    bridge.emit(RendererEventChannels.NOTIFICATION_CLICKED, { notificationId: 'n-3' });

    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/notifications');
  });

  it('stops listening after stop()', () => {
    const router = makeRouter();
    const bridge = makeBridge();
    const nav = createNotificationClickNavigation(router, () => bridge as never);
    nav.start();
    nav.stop();

    expect(bridge.off).toHaveBeenCalledWith(
      RendererEventChannels.NOTIFICATION_CLICKED,
      expect.any(Function),
    );
  });
});
