import { beforeEach, describe, expect, it } from 'vitest';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';
import { createTestPinia } from '@memoflow/test-utils';
import { useNotificationStore } from './notification-store';

function createNotification(
  overrides: Partial<NotificationClientDTO> = {},
): NotificationClientDTO {
  return {
    id: 'notification-1' as NotificationClientDTO['id'],
    title: 'Tests passed',
    ...overrides,
  } as NotificationClientDTO;
}

describe('useNotificationStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('manages list order, unread counters, pagination, and reset state', () => {
    const store = useNotificationStore();
    const first = createNotification();
    const second = createNotification({
      id: 'notification-2' as NotificationClientDTO['id'],
      title: 'Coverage improved',
    });

    store.setNotifications([first], 21);
    store.addNotification(second);
    store.updateNotification(createNotification({ id: first.id, title: 'Tests stable' }));
    store.setUnreadCount(1);
    store.incrementUnread();
    store.decrementUnread();
    store.decrementUnread();
    store.decrementUnread();
    store.setLoading(true);
    store.setError('failed');
    store.setPage(4);
    store.setInitialized(true);

    expect(store.notifications.map((item) => item.title)).toEqual([
      'Coverage improved',
      'Tests stable',
    ]);
    expect(store.unreadCount).toBe(0);
    expect(store.pagination.total).toBe(21);
    expect(store.pagination.page).toBe(4);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('failed');

    store.removeNotification(first.id);
    store.clearAll();
    expect(store.notifications).toEqual([]);

    store.reset();
    expect(store.unreadCount).toBe(0);
    expect(store.isInitialized).toBe(false);
  });
});
